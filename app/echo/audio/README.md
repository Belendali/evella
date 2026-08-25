# 音频放这里

```
1.mp3   He’s always thinking of me
2.mp3   Everything works out for me
3.mp3   I’m living my dream life
```

丢进来就自动接上 —— 播放器检测到文件就改用音频时长驱动歌词，
检测不到就按 `tracks.js` 里的 sec 跑计时器。代码不用动。

音频比脚本长或短都没关系，歌词落点会按比例伸缩。
如果某一句想卡得更准，改 `tracks.js` 里那一行的秒数就行。
