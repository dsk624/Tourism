interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const { content } = await request.json() as { content: string };

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert into D1 database
    const result = await env.DB.prepare(
      'INSERT INTO feedback (content) VALUES (?)'
    )
      .bind(content)
      .run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, meta: result.meta }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Database insertion failed');
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};