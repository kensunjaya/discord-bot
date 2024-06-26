import React from "react";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

interface MarkdownProps {
  markdown: string;
}

function Markdown({ markdown }: MarkdownProps) {
  const htmlContent = md.render(markdown);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    ></div>
  );
}

export default Markdown;