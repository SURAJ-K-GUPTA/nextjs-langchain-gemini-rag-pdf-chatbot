import { NextRequest, NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";


export async function GET(request, { params }) {
  return NextResponse.json({ msg: "Upload route working..." });
}

// Define the POST handler for the file upload
let parsedFiles = {}; // Store parsed documents for multiple files

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const question = formData.get('question') as string;
    const fileName = file ? file.name : formData.get('fileName') as string; // Get file name to use as identifier

    if (!parsedFiles[fileName] && !file) {
      return NextResponse.json({ error: 'No file uploaded or no PDF content available for this file.' }, { status: 400 });
    }
    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    // If the file has not been parsed yet, parse and store it
    if (!parsedFiles[fileName] && file) {
      const fileBlob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
      const loader = new WebPDFLoader(fileBlob);
      parsedFiles[fileName] = await loader.load(); // Store the parsed document using the file name as a key
    }

    // Extract text from the parsed document for the specific file
    const parsedText = parsedFiles[fileName].map(doc => doc.pageContent).join('\n').split("\n");

    // Call Google Gemini API for question answering
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Based on the document text: "${parsedText}", answer this question: "${question}"` }] }],
        }),
      }
    );

    const geminiResult = await geminiResponse.json();
    const answer = geminiResult.candidates[0].content.parts[0].text;

    return NextResponse.json({
      answer: answer,
      fileName: fileName, // Send the file name back for reference
      parsedText: parsedText
    });

  } catch (error) {
    console.error('Error occurred while processing the PDF or question:', error);
    return NextResponse.json({ error: 'Failed to parse the PDF or answer the question.' }, { status: 500 });
  }
};