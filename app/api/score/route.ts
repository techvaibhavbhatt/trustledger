import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Please enter a GitHub username." }, { status: 400 });
    }

    const ghRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=updated`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!ghRes.ok) {
      return NextResponse.json({ error: "GitHub user not found." }, { status: 404 });
    }

    const repos = await ghRes.json();
    const own = Array.isArray(repos) ? repos.filter((r: any) => !r.fork) : [];

    if (own.length === 0) {
      return NextResponse.json(
        { error: "This user has no original public repositories." },
        { status: 400 }
      );
    }

    const repoSummary = own.slice(0, 20).map((r: any) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      lastPush: r.pushed_at,
    }));

    const prompt = `You are a strict technical recruiter. Based on this GitHub profile data for "${username}", evaluate the developer.

Repos:
${JSON.stringify(repoSummary, null, 2)}

Return ONLY a JSON object with exactly these keys:
- "score": integer from 0 to 100 (be realistic, most developers fall between 30 and 85)
- "summary": 2 short sentences about their strengths
- "skills": array of up to 6 main technologies you can see in the repos`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return NextResponse.json({ error: "AI service error: " + errText }, { status: 500 });
    }

    const groqData = await groqRes.json();
    const parsed = JSON.parse(groqData.choices[0].message.content);

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));

    return NextResponse.json({
      username,
      score,
      summary: String(parsed.summary || ""),
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 6) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Something went wrong." }, { status: 500 });
  }
}