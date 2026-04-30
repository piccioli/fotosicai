import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function ConsentText({ markdown }) {
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(markdown || '')), [markdown]);
  return <div className="consent-text" dangerouslySetInnerHTML={{ __html: html }} />;
}
