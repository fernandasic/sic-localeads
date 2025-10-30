
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const defaultGoogleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de segmentos personalizados para tipos da API do Google
const typeMapping: { [key: string]: string } = {
  'médicos': 'doctor',
  'escritórios de contabilidade': 'accounting',
  'clínicas': 'clinic',
  'pet shops': 'pet_store',
  'restaurantes': 'restaurant',
  'academias': 'gym',
  'escritórios de advocacia': 'lawyer',
  'auto escola': 'school', // Mapeamento para Auto Escola
  'auto escolas': 'school',
  'escolas de direção': 'school',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, radius, type, apiKey } = await req.json();
    
    // Usar a API Key do usuário se fornecida, senão usar a chave global
    const googleMapsApiKey = apiKey || defaultGoogleMapsApiKey;
    
    if (!googleMapsApiKey) {
      const errorPayload = { error: "GOOGLE_MAPS_API_KEY não configurada. Por favor, configure sua chave da API do Google Maps." };
      return new Response(JSON.stringify(errorPayload), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!address || !radius || !type) {
        const errorPayload = { error: "Parâmetros 'address', 'radius' ou 'type' ausentes no corpo da requisição." };
        return new Response(JSON.stringify(errorPayload), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log(`[google-maps-proxy] Searching for: ${type} near ${address}`);

    // 1) Tenta Geocoding para obter latitude/longitude
    const geocodeRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=br&key=${googleMapsApiKey}`
    );
    const geocodeData = await geocodeRes.json();

    let lat: number | undefined;
    let lng: number | undefined;

    if (geocodeData.status === "OK" && geocodeData.results?.[0]?.geometry?.location) {
      ({ lat, lng } = geocodeData.results[0].geometry.location);
      console.log(`[google-maps-proxy] Geocoding OK: ${lat},${lng}`);
    } else {
      // 2) Fallback: Places Text Search (evita depender da Geocoding API)
      console.warn(
        `[google-maps-proxy] Geocoding falhou: ${geocodeData.status} ${geocodeData.error_message || ''}. Tentando fallback com Text Search...`
      );
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${type} em ${address}`)}&language=pt-BR&region=br&key=${googleMapsApiKey}`;
      const textRes = await fetch(textSearchUrl);
      const textData = await textRes.json();

      if (textData.status === "OK" && textData.results?.[0]?.geometry?.location) {
        ({ lat, lng } = textData.results[0].geometry.location);
        console.log(`[google-maps-proxy] Fallback Text Search OK: ${lat},${lng}`);
      } else {
        const errorPayload = {
          error: `Endereço não encontrado ou erro na geolocalização: ${geocodeData.status}`,
          details: geocodeData.error_message || textData.error_message || 'Sem detalhes',
        };
        return new Response(JSON.stringify(errorPayload), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Determinar o tipo de pesquisa
    const lowerType = type.toLowerCase();
    const mappedType = typeMapping[lowerType];
    
    let placesUrl: string;
    
    if (mappedType) {
      // Usar tipo mapeado se disponível
      placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${mappedType}&key=${googleMapsApiKey}&language=pt-BR`;
      console.log(`[google-maps-proxy] Using mapped type: ${mappedType} for search term: ${type}`);
    } else {
      // Usar busca por palavra-chave para segmentos personalizados
      placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(type)}&key=${googleMapsApiKey}&language=pt-BR`;
      console.log(`[google-maps-proxy] Using keyword search for: ${type}`);
    }

    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
      const errorPayload = { error: `Erro ao buscar locais: ${placesData.status} - ${placesData.error_message || 'Erro desconhecido da API do Google'}` };
      return new Response(JSON.stringify(errorPayload), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[google-maps-proxy] Found ${placesData.results?.length || 0} results on first page for: ${type}`);

    // Acumular todos os resultados com paginação (até 60 resultados - 3 páginas)
    let allResults = [...(placesData.results || [])];
    let nextPageToken = placesData.next_page_token;
    let pageCount = 1;

    // Buscar páginas adicionais se disponíveis
    while (nextPageToken && pageCount < 3) {
      console.log(`[google-maps-proxy] Waiting 2s before fetching page ${pageCount + 1}...`);
      // Aguardar 2 segundos (obrigatório pela API do Google)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const nextPageUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${googleMapsApiKey}&language=pt-BR`;
      console.log(`[google-maps-proxy] Fetching page ${pageCount + 1}...`);
      
      const nextPageRes = await fetch(nextPageUrl);
      const nextPageData = await nextPageRes.json();
      
      if (nextPageData.status === "OK" && nextPageData.results) {
        allResults = [...allResults, ...nextPageData.results];
        nextPageToken = nextPageData.next_page_token;
        pageCount++;
        console.log(`[google-maps-proxy] Page ${pageCount} added ${nextPageData.results.length} results. Total: ${allResults.length}`);
      } else {
        console.log(`[google-maps-proxy] No more pages available or error: ${nextPageData.status}`);
        break;
      }
    }

    console.log(`[google-maps-proxy] Total results found across ${pageCount} page(s): ${allResults.length}`);

    // Para cada resultado, buscar mais detalhes (website, telefone, etc)
    const resultsPromises = allResults.map(async (place: any) => {
      let website = undefined;
      let phone = undefined;
      let instagram = undefined;
      let whatsapp = undefined;

      // Buscar o Place Details
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${googleMapsApiKey}&language=pt-BR&fields=website,international_phone_number,url`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        if (detailsData?.result) {
          website = detailsData.result.website || detailsData.result.url;
          phone = detailsData.result.international_phone_number;
          if (website && typeof website === "string") {
            if (website.includes("instagram.com")) instagram = website;
            if (website.includes("wa.me") || website.includes("whatsapp")) whatsapp = website;
          }
        }
      } catch (e) {
        console.error(`[google-maps-proxy] Error fetching details for place_id ${place.place_id}:`, e);
      }

      return {
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        opening_hours: place.opening_hours?.open_now ? "Aberto agora" : "Fechado",
        place_id: place.place_id,
        types: place.types,
        website,
        phone,
        instagram,
        whatsapp,
      };
    });

    const results = await Promise.all(resultsPromises);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função google-maps-proxy:", error);
    const errorPayload = { error: `Erro interno da função: ${String(error)}` };
    return new Response(JSON.stringify(errorPayload), {
      status: 200, // Always 200
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
