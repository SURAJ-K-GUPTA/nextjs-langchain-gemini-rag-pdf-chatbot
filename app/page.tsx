'use client';

import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  fileName?: string;
}

export default function PDFMultiFileChatBot() {
  const [files, setFiles] = useState<File[]>([]); // Track multiple files
  const [selectedFile, setSelectedFile] = useState<string | null>(null); // Track selected file
  const [question, setQuestion] = useState<string>('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection (allow multiple file uploads)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files ? Array.from(e.target.files) : [];
    setFiles(uploadedFiles);
    setError(null);
    setChat([]); // Reset chat for new file uploads
    setSelectedFile(null);
  };

  // Handle form submission (ask question)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to ask a question about.');
      return;
    }
    if (!question) {
      setError('Please enter a question.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      const file = files.find((f) => f.name === selectedFile);

      if (file) {
        formData.append('file', file); // Send the file only if not already uploaded
      } else {
        formData.append('fileName', selectedFile); // Send the file name to retrieve stored content
      }

      formData.append('question', question);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setChat((prevChat) => [
          ...prevChat,
          { role: 'user', content: question, fileName: selectedFile },
          { role: 'bot', content: data.answer, fileName: selectedFile },
        ]);
      } else {
        setError(data.error || 'Failed to process the PDF.');
      }
    } catch (err) {
      setError('An error occurred while uploading the PDF or processing the question.');
    } finally {
      setQuestion(''); // Clear the input for the next question
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ask Questions About Multiple PDFs</h1>

      <div className="mb-4">
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700"
        />
      </div>

      {files.length > 0 && (
        <div className="mb-4">
          <label htmlFor="file-select" className="block text-sm font-medium text-gray-700">Select File:</label>
          <select
            id="file-select"
            value={selectedFile || ''}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="" disabled>Select a file</option>
            {files.map((file) => (
              <option key={file.name} value={file.name}>
                {file.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="chat-window border rounded p-4 h-96 overflow-y-auto bg-gray-100 mb-4">
        {chat.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <p className={`p-2 rounded inline-block ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
              <strong>{message.fileName}:</strong> {message.content}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading || !selectedFile}
        >
          {loading ? 'Processing...' : 'Ask Question'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}
