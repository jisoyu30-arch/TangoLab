interface Props {
  videoId: string | null;
}

export function YouTubePlayer({ videoId }: Props) {
  if (!videoId) {
    return (
      <div className="bg-white/5 rounded-xl p-8 text-center border border-secretary-gold/10">
        <div className="text-gray-500 text-sm">YouTube 영상을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden border border-secretary-gold/10">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
