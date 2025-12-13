
export const onRequestPost = async () => {
  return new Response(JSON.stringify({ 
    error: 'AI Planner functionality has been removed.' 
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
};
