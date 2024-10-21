import { NextResponse } from 'next/server';
export async function GET() {
    return NextResponse.json({ message: 'Hello World' });
    // Call the Gemini API (example API call)
    //     const geminiResponse = await fetch(
    //       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    //       {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({
    //           contents: [{ parts: [{ text: `Based on the document text: "${documentText}", answer this question: "${question}"` }] }],
    //         }),
    //       }
    //     );

    //     const geminiResult = await geminiResponse.json();
    //     const answer = geminiResult.content;
  }
  