import type { Video } from '../api/types';
import { Card } from './Card';

interface Props {
  id: string;
  title: string;
  extra?: string;
  videos: Video[];
  studio?: boolean;
  onOpen: (v: Video) => void;
}

export function Row({ id, title, extra, videos, studio, onOpen }: Props) {
  if (!videos.length) return null;
  return (
    <section class={'row' + (studio ? ' studio' : '')} data-block>
      <h2>
        {title}
        {extra ? <span>{extra}</span> : null}
      </h2>
      <div class="track" data-track>
        {videos.map((v) => (
          <Card key={v.id} video={v} fid={`${id}:${v.id}`} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
