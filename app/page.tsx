'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  fileName?: string;
}

export default function PDFMultiFileChatBot() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const chatWindowRef = useRef<HTMLDivElement>(null);

  const formatBoldText = (text: string): JSX.Element[] => {
    // Split the text by the bold markers
    const parts = text.split(/(\*\*.*?\*\*)/g);
  
    return parts.map((part, index) => {
      // Check if the part is bold
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2); // Remove the asterisks
        return (
          <strong key={index}>
            {boldText}
          </strong>
        );
      }
      // Return non-bold parts as plain text
      return <span key={index}>{part}</span>; // Wrap non-bold parts in a span for consistency
    });
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files ? Array.from(e.target.files) : [];
    setFiles(uploadedFiles);
    setError(null);
    setChat([]);
    setSelectedFile(null);
  };

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
        formData.append('file', file);
      } else {
        formData.append('fileName', selectedFile);
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
      setQuestion('');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div className="container mx-auto p-6 bg-red-50 shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-red-700 mb-4">PDF Chat Assistant</h1>

      <div className="mb-4">
      <label htmlFor="file-upload" className="upload-button">
          Choose PDF Files
          <input
            id="file-upload"
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="mb-4">
          <label htmlFor="file-select" className="block text-lg font-medium text-red-700">Select File:</label>
          <select
            id="file-select"
            value={selectedFile || ''}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="block w-full p-2 border border-red-300 rounded-md text-red-700"
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

      <div
        ref={chatWindowRef}
        className="chat-window border rounded-lg p-4 h-96 overflow-y-auto bg-white mb-4 shadow-inner scrollbar-thin scrollbar-thumb-red-400 scrollbar-track-red-100"
      >
        {chat.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <p className={`p-2 rounded-lg inline-block ${message.role === 'user' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`}>
              <strong>{message.fileName}:</strong> {formatBoldText(message.content)}
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
            placeholder="Type your question here"
            className="focus:border-red dark:text-red-600 text-red-700 mt-1 p-2 block w-full border border-red-300 rounded-md focus:ring-red-500 focus:border-red-300 focus:outline-none focus:ring-0"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition ease-in-out"
          disabled={loading || !selectedFile}
        >
          {loading ? 'Processing...' : 'Ask Question'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
