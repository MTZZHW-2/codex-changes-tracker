import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  registerRoot,
  useCurrentFrame,
} from 'remotion';
import changesJson from '../../changes.json';

type Change = {
  pr: number;
  merged_at: string;
  summary: string;
  details: string[];
  url: string;
};

const FPS = 30;
const INTRO = 90;
const ITEM = 180;
const OUTRO = 60;

const sgDate = (iso: string) =>
  new Date(new Date(iso).getTime() + 8 * 3600000).toISOString().slice(0, 10);

const sgTime = (iso: string) =>
  new Date(new Date(iso).getTime() + 8 * 3600000).toISOString().slice(11, 16);

const all = (changesJson as Change[])
  .slice()
  .sort((a, b) => b.merged_at.localeCompare(a.merged_at));

const date = all.length ? sgDate(all[0].merged_at) : '—';
const changes = all.filter((x) => sgDate(x.merged_at) === date);
const duration = INTRO + changes.length * ITEM + OUTRO;

const page: React.CSSProperties = {
  backgroundColor: '#0b0b0c',
  color: '#f5f5f5',
  fontFamily: 'Arial, "Noto Sans CJK SC", "Noto Sans CJK", sans-serif',
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{...page, padding: '130px 150px', justifyContent: 'center'}}>
      <div style={{opacity}}>
        <div style={{fontSize: 94, fontWeight: 700}}>Codex Changes</div>
        <div style={{fontSize: 38, color: '#99999f', marginTop: 28}}>{date}</div>
        <div style={{height: 1, background: '#36363a', margin: '52px 0 42px'}} />
        <div style={{fontSize: 46}}>{changes.length} 个已合并 PR</div>
      </div>
    </AbsoluteFill>
  );
};

const ChangeScene: React.FC<{item: Change; index: number}> = ({item, index}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 12, 166, 179], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const progress = interpolate(frame, [0, ITEM - 1], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{...page, padding: '82px 110px 72px', opacity: fade}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 28, alignItems: 'center'}}>
          <div style={{fontSize: 38, color: '#b0b0b5'}}>PR #{item.pr}</div>
          <div style={{fontSize: 28, color: '#66666c'}}>{sgTime(item.merged_at)}</div>
        </div>
        <div style={{fontSize: 28, color: '#66666c'}}>{index + 1} / {changes.length}</div>
      </div>

      <div style={{height: 1, background: '#343438', margin: '28px 0 46px'}} />

      <div
        style={{
          fontSize: 52,
          lineHeight: 1.3,
          fontWeight: 700,
          maxWidth: 1580,
          opacity: interpolate(frame, [5, 24], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {item.summary}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 24, marginTop: 48}}>
        {item.details.map((detail, i) => (
          <div
            key={detail}
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 34,
              lineHeight: 1.45,
              color: '#d7d7da',
              opacity: interpolate(frame, [24 + i * 9, 40 + i * 9], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span style={{color: '#77777d'}}>•</span>
            <span>{detail}</span>
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 110, right: 110, bottom: 50}}>
        <div style={{fontSize: 22, color: '#5d5d62', marginBottom: 16}}>{item.url}</div>
        <div style={{height: 3, background: '#27272a'}}>
          <div style={{height: '100%', width: String(progress) + '%', background: '#98989d'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 16, 44, 59], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{...page, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center', opacity}}>
        <div style={{fontSize: 78, fontWeight: 700}}>Codex Changes</div>
        <div style={{fontSize: 32, color: '#77777d', marginTop: 24}}>{date}</div>
      </div>
    </AbsoluteFill>
  );
};

const Video: React.FC = () => (
  <AbsoluteFill style={page}>
    <Sequence from={0} durationInFrames={INTRO}><Intro /></Sequence>
    {changes.map((item, index) => (
      <Sequence key={item.pr} from={INTRO + index * ITEM} durationInFrames={ITEM}>
        <ChangeScene item={item} index={index} />
      </Sequence>
    ))}
    <Sequence from={INTRO + changes.length * ITEM} durationInFrames={OUTRO}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);

const Root: React.FC = () => (
  <Composition
    id="DailyCodexChanges"
    component={Video}
    durationInFrames={duration}
    fps={FPS}
    width={1920}
    height={1080}
  />
);

registerRoot(Root);
