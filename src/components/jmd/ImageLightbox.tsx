import { useState } from 'react';

interface Image {
  src: string;
  title?: string;
}

interface Props {
  images: Image[];
}

export default function ImageLightbox({ images }: Props) {
  const [current, setCurrent] = useState<number | null>(null);

  const open = (i: number) => setCurrent(i);
  const close = () => setCurrent(null);
  const prev = () => setCurrent(i => (i! - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i! + 1) % images.length);

  return (
    <>
      <ul className="thumb-list brackets-list">
        {images.map((img, i) => (
          <li key={img.src}>
            <a
              href={img.src}
              onClick={(e) => { e.preventDefault(); open(i); }}
              title={img.title}
            >
              <img src={img.src} alt={img.title ?? ''} />
            </a>
          </li>
        ))}
      </ul>

      {current !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={close}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer' }}
          >‹</button>
          <img
            src={images[current].src}
            alt={images[current].title ?? ''}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer' }}
          >›</button>
          <button
            onClick={close}
            style={{ position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}
          >✕</button>
        </div>
      )}
    </>
  );
}
