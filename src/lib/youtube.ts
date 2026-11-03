// Converte um link do YouTube no endereço de incorporação (sem cookies de publicidade)
export function embedYoutube(url: string | null): string | null {
  if (!url) return null;
  const m =
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtube\.com\/(?:embed|shorts|live)\/([\w-]{6,})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1` : null;
}
