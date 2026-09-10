/* ═══════════════════════════════════════════════════
   tracks.js — 三段音频的文案与配速

   每一行是一句「歌词」。sec 是这句停留多久 —— 没有音频文件时
   靠它跑；音频一旦放进 audio/ 目录，就改用 audio.currentTime
   驱动，sec 只作为落点的相对权重。
   ═══════════════════════════════════════════════════ */

const TRACKS = {
  1: {
    title: 'He’s always thinking of me',
    cover: '../../assets/covers/cover-2.jpg',
    audio: '../audio/1.mp3',
    lines: [
      ['No matter what he is doing or who he is with,', 4.2],
      ['he is always thinking about me.', 4.0],
      ['Everything reminds him of me.', 4.0],
      ['I am completely irreplaceable.', 4.0],
      ['I am truly his dream girl.', 4.0],
      ['He simply can’t get me off his mind.', 4.4],
      ['He is constantly reaching out,', 3.4],
      ['texting me, and calling me.', 4.2]
    ]
  },

  2: {
    title: 'Everything works out for me',
    cover: '../../assets/covers/cover-3.jpg',
    audio: '../audio/2.mp3',
    lines: [
      ['I love how everything always works out for me.', 4.8],
      ['Everything I desire finds its way to me,', 4.4],
      ['and wherever I go,', 2.8],
      ['things naturally align in my favor.', 4.2],
      ['Ideas flow to me effortlessly.', 4.0],
      ['I am always in the right place', 3.4],
      ['at the right time.', 4.0]
    ]
  },

  3: {
    title: 'I’m living my dream life',
    cover: '../../assets/covers/cover-5.jpg',
    audio: '../audio/3.mp3',
    lines: [
      ['My life is perfect.', 3.2],
      ['I am living my dream life.', 3.8],
      ['All of my dreams have manifested,', 4.0],
      ['and every dream that comes next will manifest too.', 5.0],
      ['I have everything I desire.', 3.8],
      ['Life feels easy for me,', 3.2],
      ['and everything always works in my favor.', 4.6],
      ['My friends are kind, supportive,', 3.6],
      ['and aligned with my values.', 3.8],
      ['I adore myself,', 2.8],
      ['I put myself first,', 2.8],
      ['and I protect my energy.', 3.8],
      ['I have everything I have ever dreamed of,', 4.4],
      ['and my life is filled with blessings.', 4.4],
      ['I am deeply fulfilled in my work', 3.6],
      ['and my relationships.', 4.2]
    ]
  }
};
