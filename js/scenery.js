/* 分层像素场景。所有装饰均不参与碰撞；落脚面由原有瓦片决定。 */
var Scenery = (function () {
  function rect(c, color, x, y, w, h) {
    c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function poly(c, color, pts) {
    c.fillStyle = color; c.beginPath(); c.moveTo(Math.round(pts[0][0]), Math.round(pts[0][1]));
    for (var i = 1; i < pts.length; i++) c.lineTo(Math.round(pts[i][0]), Math.round(pts[i][1]));
    c.closePath(); c.fill();
  }
  function cloud(c, x, y, w, color, shade) {
    rect(c, shade, x, y + 9, w, 9);
    rect(c, color, x + 4, y + 4, w - 8, 11);
    rect(c, color, x + 12, y, Math.max(8, w - 27), 10);
    rect(c, color, x, y + 10, w, 3);
  }
  function hill(c, x, y, w, h, color, shade) {
    poly(c, color, [[x,y],[x+w*.12,y-h*.5],[x+w*.28,y-h*.85],[x+w*.42,y-h],
      [x+w*.6,y-h],[x+w*.8,y-h*.65],[x+w,y]]);
    poly(c, shade, [[x+w*.6,y-h],[x+w*.8,y-h*.65],[x+w,y],[x+w*.75,y]]);
  }
  function crystal(c, x, y, size, bright) {
    var base = bright ? '#339cad' : '#24515f', light = bright ? '#94eddd' : '#377c84';
    poly(c, base, [[x,y],[x-size*.3,y-size*.8],[x,y-size],[x+size*.3,y-size*.65],[x+size*.25,y]]);
    poly(c, light, [[x,y],[x,y-size],[x+size*.12,y-size*.65],[x+size*.12,y]]);
    poly(c, base, [[x+size*.3,y],[x+size*.22,y-size*.5],[x+size*.5,y-size*.65],[x+size*.6,y]]);
  }
  function torch(c, x, y, frame) {
    var flicker = Math.floor(frame / 7) % 3;
    rect(c, '#342331', x - 10, y - 13, 26, 31);
    rect(c, '#4d2930', x - 5, y - 8, 16, 20);
    rect(c, '#785342', x, y + 3, 4, 11);
    rect(c, '#18202d', x - 2, y + 10, 8, 3);
    rect(c, '#dc673e', x - 2, y - 5 - flicker, 8, 11 + flicker);
    rect(c, '#f5b954', x, y - 8 + flicker, 4, 12);
    rect(c, '#fff0ad', x + 1, y - 3, 2, 5);
  }
  function windmill(c, x, y, frame) {
    poly(c, '#b6c6b0', [[x,y],[x+6,y-41],[x+23,y-41],[x+31,y]]);
    rect(c, '#e7dcad', x+8, y-35, 13, 35);
    poly(c, '#956a69', [[x+1,y-41],[x+15,y-54],[x+30,y-41]]);
    rect(c, '#617e83', x+12, y-15, 6, 15);
    c.save(); c.translate(Math.round(x+15),y-35); c.rotate(frame*.004);
    for(var i=0;i<4;i++) { c.rotate(Math.PI/2); rect(c,'#eff0c7',-2,4,5,25); rect(c,'#b9b99b',0,5,1,23); }
    c.restore(); rect(c,'#77534b',x+12,y-38,6,6);
  }
  function background(c, level, cam, frame) {
    var theme = level.theme, x, i, y;
    if (theme === 'overworld' || theme === 'sky') {
      var sky = theme === 'sky';
      var bands = sky ? ['#607db5','#789cc8','#93b9d5','#b8d8df'] : ['#78b7d0','#92c9da','#afdbdc','#d0e6cf'];
      for(i=0;i<4;i++) rect(c,bands[i],0,i*60,256,60);
      rect(c, sky ? '#f8e9ce' : '#fff2b5', 194, 43, 22, 30);
      rect(c, sky ? '#f8e9ce' : '#fff2b5', 190, 47, 30, 22);
      for(i=-1;i<6;i++) {
        x=i*83 - (cam*.12 % 83);
        cloud(c,x,52 + (i%3+3)%3*17,44,'#edf0dc',sky?'#b5c8d8':'#bad8d6');
      }
      if (sky) {
        for(i=-1;i<6;i++) {
          x=i*100-(cam*.23%100);
          hill(c,x,213,80,56+(i%2)*12,'#82a2bc','#7194b0');
          cloud(c,x-10,183+(i%2)*9,114,'#e6ecdc','#c8dadd');
          cloud(c,x+20,213,110,'#f3f2dd','#dbe4dd');
        }
        // 远处小浮岛，与可站立的前景平台保持低对比。
        for(i=-1;i<5;i++) {
          x=i*115-(cam*.32%115); y=130+(i%2)*24;
          poly(c,'#a5b5b2',[[x,y],[x+34,y],[x+24,y+21],[x+14,y+28]]);
          rect(c,'#b6d4ba',x-3,y-3,40,4);
          rect(c,'#b9d9d4',x+20,y+7,3,27);
        }
      } else {
        for(i=-1;i<6;i++) {
          x=i*90-(cam*.2%90);
          hill(c,x,191,114,54+(i%3+3)%3*11,'#83b6a1','#75a692');
        }
        windmill(c, 118-(cam*.3%400),184,frame);
        windmill(c, 518-(cam*.3%400),184,frame);
        for(i=-1;i<7;i++) {
          x=i*70-(cam*.45%70);
          hill(c,x,208,88,30+(i%2)*10,'#66946f','#557f64');
          rect(c,'#709b76',x+15,180,6,11);
        }
        // 木篱笆在地形后，平地与断崖仍由前景完整遮挡。
        for(i=Math.floor(cam/16)-1;i<Math.ceil((cam+256)/16)+1;i++) {
          if(i%28>7 && i%28<16 && level.tiles[13][i] === 'X') {
            x=i*16-cam; rect(c,'#a3aa79',x,198,16,2); rect(c,'#a3aa79',x+3,192,3,16);
          }
        }
      }
    } else if(theme === 'underground') {
      rect(c,'#101e32',0,0,256,240);
      for(i=-1;i<6;i++) {
        x=i*78-(cam*.25%78);
        poly(c,'#1c3044',[[x,30],[x+17,76],[x+24,154],[x+47,209],[x-10,240]]);
        poly(c,'#192b40',[[x+23,32],[x+47,92],[x+62,43]]);
        crystal(c,x+34,197,37,false);
        rect(c,'#244959',x+52,49,3,111);
        rect(c,'#1d394c',x+56,52,2,108);
      }
      for(i=-1;i<5;i++) {
        x=i*112-(cam*.62%112);
        rect(c,'#344258',x,48,7,160); rect(c,'#425068',x-3,45,13,5);
        rect(c,'#344258',x,54,91,5);
        poly(c,'#344258',[[x+7,58],[x+7,77],[x+25,58]]);
        crystal(c,x+46,208,25,true);
        rect(c,'#20334a',x+24,204,59,4);
      }
      for(i=0;i<16;i++) {
        x=((i*47-cam*.35)%280+280)%280-12;
        y=65+(i*31%122); var glow=Math.sin(frame*.04+i)>0.45;
        rect(c,glow?'#8ac8c3':'#396175',x,y,1,2);
      }
    } else {
      rect(c,'#191b2b',0,0,256,240);
      for(y=40;y<208;y+=16) for(i=-1;i<10;i++) {
        x=i*34+(y%32?17:0)-(cam*.3%34);
        rect(c,'#242536',x,y,32,14); rect(c,'#2b2b3d',x,y,32,1);
      }
      for(i=-1;i<5;i++) {
        x=i*96-(cam*.55%96);
        rect(c,'#343344',x,59,40,113); rect(c,'#0f1625',x+5,68,30,99);
        rect(c,'#343344',x+5,53,30,8); rect(c,'#343344',x+11,49,18,5);
        rect(c,'#512d38',x+9,114,22,53); rect(c,'#893f3b',x+9,148,22,19);
        rect(c,'#242738',x+18,64,4,106); rect(c,'#242738',x+5,104,30,4);
        rect(c,'#393746',x+51,32,8,176); rect(c,'#504554',x+50,46,10,3);
        torch(c,x+53,108,frame+i*7);
        rect(c,'#713b4e',x+69,45,13,38); rect(c,'#9a5360',x+70,45,2,30);
        poly(c,'#713b4e',[[x+69,83],[x+75,89],[x+82,83]]);
        rect(c,'#d7a464',x+73,53,5,9);
      }
      // 熔岩只画在无落脚面的坑底，安全平台不伪装成危险区域。
      for(i=Math.max(0,Math.floor(cam/16));i<Math.min(level.width,Math.ceil((cam+256)/16));i++) {
        if(level.tiles[13][i] !== ' ') continue;
        x=i*16-cam;
        rect(c,'#702b36',x,207,16,33); rect(c,'#c44d39',x,214,16,26);
        rect(c,'#ed8845',x,214,16,4);
        for(var j=0;j<4;j++) rect(c,'#ffce77',x+j*4,213+Math.round(Math.sin(frame*.09+i+j)*2),3,2);
      }
      for(i=0;i<9;i++) {
        x=((i*37-cam*.7+Math.sin(frame*.02+i)*4)%270+270)%270;
        y=230-((frame*.35+i*23)%155);
        rect(c,i%2?'#97513c':'#d78a51',x,y,1,2);
      }
    }
  }
  function terrain(c, level, cam, frame) {
    var left=Math.max(0,Math.floor(cam/16)),right=Math.min(level.width-1,Math.ceil((cam+256)/16));
    for(var tx=left;tx<=right;tx++) for(var ty=2;ty<15;ty++) {
      var ch=level.tiles[ty][tx], above=level.tiles[ty-1][tx];
      var x=Math.round(tx*16-cam),y=ty*16;
      if(ch==='X' && !World.isSolid(above)) {
        if(level.theme==='overworld') {
          rect(c,'#305b44',x,y,16,5);rect(c,'#7fbe61',x,y,16,2);
          rect(c,'#519254',x+2,y+2,5,4);rect(c,'#519254',x+10,y+2,4,3);
          if(above===' ' && tx%7===2) {
            rect(c,'#406645',x+6,y-5,1,5);rect(c,'#f0dfaa',x+4,y-6,5,2);rect(c,'#d49760',x+6,y-7,1,3);
          }
        } else if(level.theme==='underground') {
          rect(c,'#4e7b8b',x,y,16,2);rect(c,'#87b4bd',x+3,y,4,1);
        } else if(level.theme==='castle') {
          rect(c,'#aa8990',x,y,16,2);rect(c,'#51434f',x,y+3,16,2);
        } else {
          rect(c,'#91ba82',x,y,16,3);rect(c,'#d9dfaa',x,y,16,1);
        }
      }
      if(ch==='E') {
        rect(c,'#633c57',x,y,16,16);rect(c,'#ee887b',x,y,16,4);
        rect(c,'#ffe4b5',x+1,y,14,1);rect(c,'#37384d',x+2,y+4,12,10);
        for(var coil=0;coil<3;coil++) rect(c,'#bcd6d5',x+3+(coil%2)*2,y+5+coil*3,9,2);
        rect(c,'#ee887b',x,y+14,16,2);
        poly(c,'#ffe4b5',[[x+4,y-5],[x+8,y-9],[x+12,y-5]]);
      }
      if(level.theme==='sky' && ch==='S' && !World.isSolid(above)) {
        // 蘑菇岛的整个彩色顶面都可站立，支柱仅为低对比背景。
        rect(c,'#a15367',x,y,16,16);rect(c,'#e8837c',x,y,16,6);
        rect(c,'#f8dec0',x+4,y+1,5,3);rect(c,'#f0b9a0',x,y+6,16,2);
        rect(c,'#e3bd99',x,y+9,16,4);rect(c,'#9a7883',x,y+14,16,2);
        if(tx%3===0 && ty<12) {
          rect(c,'#799b94',x+7,y+16,3,19);rect(c,'#96b2a0',x+4,y+22,4,2);
        }
      }
    }
  }
  var STAR=['....#....','....#....','#########','.#######.','..#####..','..#####..','.###.###.','.##...##.'];
  function star(c,x,y,color,scale) {
    for(var yy=0;yy<STAR.length;yy++) for(var xx=0;xx<9;xx++) if(STAR[yy][xx]==='#') rect(c,color,x+xx*scale,y+yy*scale,scale,scale);
  }
  function medal(c,x,y,frame,collected) {
    if(collected) return;
    y+=Math.round(Math.sin(frame*.07)*2);
    rect(c,'#9b562d',x+2,y,10,16);rect(c,'#9b562d',x,y+3,14,10);
    rect(c,'#ffe5a0',x+2,y+1,10,13);rect(c,'#f5bc4b',x+1,y+4,12,8);
    star(c,x+3,y+4,'#b66c32',.85);
    rect(c,'#fff8d4',x+3,y+2,3,2);
    if(Math.floor(frame/12)%3===0) { rect(c,'#fff7d8',x+16,y,1,5);rect(c,'#fff7d8',x+14,y+2,5,1); }
  }
  return { background: background, terrain: terrain, medal: medal, star: star };
})();
