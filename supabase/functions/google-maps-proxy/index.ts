
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!googleMapsApiKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY não configurada no Supabase Secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { address, radius, type } = await req.json();

    // Consultar a API de Geocoding para converter endereço em latitude/longitude
    const geocodeRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
    );
    const geocodeData = await geocodeRes.json();
    if (geocodeData.status !== "OK" || !geocodeData.results?.[0]?.geometry?.location) {
      return new Response(JSON.stringify({ error: "Endereço não encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Buscar empresas no raio usando Places API (NearbySearch)
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${googleMapsApiKey}&language=pt-BR`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    // Para cada resultado, buscar mais detalhes (website, telefone, etc)
    const resultsPromises = (placesData.results ?? []).map(async (place: any) => {
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
      } catch (e) {} // Silencioso para casos em que não há detalhes

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
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
