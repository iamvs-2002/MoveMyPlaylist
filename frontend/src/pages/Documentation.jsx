import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  BookOpen,
  Zap,
  Shield,
  Users,
  Code,
  Heart,
} from "lucide-react";

const Documentation = () => {
  const [readmeContent, setReadmeContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        // Fetch the README.md content from the repository
        const response = await fetch(
          "https://raw.githubusercontent.com/iamvs-2002/movemyplaylist/main/README.md",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch README");
        }
        const content = await response.text();
        setReadmeContent(content);
      } catch (err) {
        setError(err.message);
        // Fallback to a basic documentation structure
        setReadmeContent(
          "# MoveMyPlaylist Documentation\n\nDocumentation is being loaded...",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadme();
  }, []);

  const renderMarkdown = (content) => {
    if (!content) return null;

    // Simple markdown to JSX conversion for basic formatting
    const lines = content.split("\n");
    const elements = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let inList = false;
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <pre
              key={`code-${i}`}
              className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4"
            >
              <code className="text-sm font-mono text-gray-800">
                {codeBlockContent.join("\n")}
              </code>
            </pre>,
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(line.substring(2));
        continue;
      } else if (inList && line.trim() === "") {
        // End of list
        if (listItems.length > 0) {
          elements.push(
            <ul key={`list-${i}`} className="list-disc ml-6 mb-4">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-600 mb-1">
                  {item}
                </li>
              ))}
            </ul>,
          );
        }
        inList = false;
        listItems = [];
        continue;
      } else if (inList) {
        // End of list (non-empty line that's not a list item)
        if (listItems.length > 0) {
          elements.push(
            <ul key={`list-${i}`} className="list-disc ml-6 mb-4">
              {listItems.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-600 mb-1">
                  {item}
                </li>
              ))}
            </ul>,
          );
        }
        inList = false;
        listItems = [];
      }

      // Headers
      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={i}
            className="text-3xl font-bold text-gray-900 mb-4 mt-8 first:mt-0"
          >
            {line.substring(2)}
          </h1>,
        );
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={i}
            className="text-2xl font-semibold text-gray-800 mb-3 mt-6"
          >
            {line.substring(3)}
          </h2>,
        );
        continue;
      }
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="text-xl font-semibold text-gray-700 mb-2 mt-4">
            {line.substring(4)}
          </h3>,
        );
        continue;
      }
      if (line.startsWith("#### ")) {
        elements.push(
          <h4 key={i} className="text-lg font-medium text-gray-700 mb-2 mt-3">
            {line.substring(5)}
          </h4>,
        );
        continue;
      }

      // Inline code
      if (line.includes("`")) {
        const parts = line.split("`");
        const processedParts = parts.map((part, partIndex) =>
          partIndex % 2 === 0 ? (
            part
          ) : (
            <code
              key={partIndex}
              className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono"
            >
              {part}
            </code>
          ),
        );
        elements.push(
          <p key={i} className="text-gray-600 mb-3">
            {processedParts}
          </p>,
        );
        continue;
      }

      // Links
      if (line.includes("[") && line.includes("](") && line.includes(")")) {
        const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const [, text, url] = linkMatch;
          elements.push(
            <p key={i} className="text-gray-600 mb-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {text} <ExternalLink className="inline w-3 h-3" />
              </a>
            </p>,
          );
          continue;
        }
      }

      // Empty lines
      if (line.trim() === "") {
        elements.push(<div key={i} className="h-2"></div>);
        continue;
      }

      // Regular paragraphs
      if (line.trim()) {
        elements.push(
          <p key={i} className="text-gray-600 mb-3 leading-relaxed">
            {line}
          </p>,
        );
      }
    }

    // Handle any remaining list
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key="list-final" className="list-disc ml-6 mb-4">
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex} className="text-gray-600 mb-1">
              {item}
            </li>
          ))}
        </ul>,
      );
    }

    return elements;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white/40">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/5 border border-red-500/20 rounded-2xl p-8 shadow-glass">
            <h2 className="text-xl font-display font-bold text-red-400 mb-2">
              Error Loading Documentation
            </h2>
            <p className="text-white/40 mb-6">{error}</p>
            <a
              href="https://github.com/iamvs-2002/movemyplaylist/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Github className="w-4 h-4 mr-2" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Header Info */}
      <div className="relative z-10 bg-white/5 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4 shadow-glass">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                  MoveMyPlaylist
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white tracking-tight">
                Documentation
              </h1>
            </div>
            <a
              href="https://github.com/iamvs-2002/movemyplaylist/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline flex items-center space-x-3"
            >
              <Github className="w-5 h-5" />
              <span>Source on GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl shadow-glass p-6 sm:p-12 md:p-16">
          <div className="doc-content text-white/70 leading-relaxed space-y-4">
            {renderMarkdown(readmeContent)}
          </div>
        </div>
      </div>

      {/* Custom Styles for Docs */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .doc-content h1 { @apply text-4xl font-display font-bold text-white mt-12 mb-6 border-b border-white/10 pb-4; }
        .doc-content h2 { @apply text-2xl font-display font-bold text-white mt-10 mb-5; }
        .doc-content h3 { @apply text-xl font-display font-bold text-white mt-8 mb-4; }
        .doc-content p { @apply text-white/60 mb-6; }
        .doc-content ul { @apply list-disc ml-6 mb-8 text-white/50 space-y-3; }
        .doc-content li { @apply mb-2; }
        .doc-content pre { @apply bg-black/50 p-6 rounded-2xl border border-white/10 overflow-x-auto mb-8 shadow-inner; }
        .doc-content code { @apply font-mono text-sm px-1.5 py-0.5 bg-white/5 rounded text-primary; }
        .doc-content a { @apply text-primary hover:text-white underline decoration-primary/30 underline-offset-4 transition-colors; }
      `,
        }}
      />
    </div>
  );
};

export default Documentation;
