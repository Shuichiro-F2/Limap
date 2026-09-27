// 何も無いとき（投稿がまだ無い・ログイン前など）に添える、ドット絵の扉。
// 16×16マスを小さな四角で描く。ink が扉と人影、paper が扉の内側の色。
import React from 'react';
import { View } from 'react-native';

const DOOR_RECTS: { x: number; y: number; w: number; h: number; fill: 'ink' | 'paper' }[] = [
  { x: 3, y: 2, w: 10, h: 12, fill: 'ink' },
  { x: 4, y: 3, w: 8, h: 10, fill: 'paper' },
  { x: 7, y: 5, w: 2, h: 2, fill: 'ink' },
  { x: 6, y: 7, w: 3, h: 3, fill: 'ink' },
  { x: 5, y: 10, w: 2, h: 2, fill: 'ink' },
  { x: 8, y: 10, w: 2, h: 2, fill: 'ink' },
];

export default function PixelDoor({ size = 40, ink, paper }: { size?: number; ink: string; paper: string }) {
  const unit = size / 16;
  return (
    <View style={{ width: size, height: size }}>
      {DOOR_RECTS.map((r, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: r.x * unit,
            top: r.y * unit,
            width: r.w * unit,
            height: r.h * unit,
            backgroundColor: r.fill === 'ink' ? ink : paper,
          }}
        />
      ))}
    </View>
  );
}
