
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

    // Buscar empresas no raio usando Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${googleMapsApiKey}&language=pt-BR`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    // Opcional: Limitar campos retornados e simplificar o payload
    const results = (placesData.results ?? []).map((place: any) => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      opening_hours: place.opening_hours?.open_now ? "Aberto agora" : "Fechado",
      place_id: place.place_id,
      types: place.types,
    }));

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
