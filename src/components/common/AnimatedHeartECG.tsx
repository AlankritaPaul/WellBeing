import React from 'react';
import heartCenterImg from '../../assets/heart_center.png';

interface AnimatedHeartECGProps {
  className?: string;
  theme?: string;
}

// Exact coordinate path of the left ECG waveform from pixel 32 to pixel 126
const LEFT_PATH =
  "M 32 161.0 L 33 161.0 L 34 160.5 L 35 160.5 L 36 160.5 L 37 160.5 L 38 160.5 L 39 160.5 L 40 160.5 L 41 160.5 L 42 160.5 L 43 160.5 L 44 160.5 L 45 160.5 L 46 160.5 L 47 160.5 L 48 157.5 L 49 154.5 L 50 149.5 L 51 145.5 L 52 140.5 L 53 135.5 L 54 129.0 L 55 125.0 L 56 120.0 L 57 117.5 L 58 117.0 L 59 131.5 L 60 135.5 L 61 136.5 L 62 138.5 L 63 143.0 L 64 157.0 L 65 155.5 L 66 153.5 L 67 152.5 L 68 151.0 L 69 148.5 L 70 149.5 L 71 151.5 L 72 153.0 L 73 154.0 L 74 155.5 L 75 152.5 L 76 140.0 L 77 120.0 L 78 111.0 L 79 100.5 L 80 91.0 L 81 70.0 L 82 55.5 L 83 42.5 L 84 37.5 L 85 39.5 L 86 48.5 L 87 84.0 L 88 95.5 L 89 101.0 L 90 106.0 L 91 119.0 L 92 151.5 L 93 161.4 L 94 161.0 L 95 160.0 L 96 159.0 L 97 159.0 L 98 168.0 L 99 174.5 L 100 181.5 L 101 185.0 L 102 192.5 L 103 200.5 L 104 210.0 L 105 214.5 L 106 219.0 L 107 220.5 L 108 221.0 L 109 220.0 L 110 216.5 L 111 213.5 L 112 207.5 L 113 199.5 L 114 192.0 L 115 185.5 L 116 181.0 L 117 174.0 L 118 167.5 L 119 161.0 L 120 158.0 L 121 158.0 L 122 158.5 L 123 159.0 L 124 160.0 L 125 160.5 L 126 160.5";

// Exact coordinate path of the right ECG waveform from pixel 258 to pixel 353
const RIGHT_PATH =
  "M 258 161.0 L 259 161.5 L 260 161.5 L 261 161.0 L 262 161.0 L 263 161.0 L 264 160.5 L 265 160.5 L 266 160.5 L 267 160.5 L 268 160.5 L 269 159.5 L 270 157.0 L 271 152.5 L 272 148.0 L 273 144.0 L 274 138.5 L 275 134.0 L 276 128.0 L 277 123.5 L 278 118.5 L 279 116.0 L 280 118.5 L 281 133.0 L 282 136.0 L 283 137.5 L 284 139.0 L 285 143.5 L 286 156.5 L 287 155.0 L 288 153.5 L 289 152.5 L 290 150.5 L 291 149.0 L 292 151.5 L 293 152.5 L 294 154.0 L 295 155.0 L 296 157.5 L 297 151.0 L 298 141.0 L 299 125.0 L 300 114.0 L 301 101.0 L 302 90.0 L 303 72.5 L 304 60.0 L 305 46.0 L 306 39.0 L 307 54.0 L 308 85.0 L 309 95.0 L 310 99.0 L 311 105.0 L 312 121.5 L 313 156.0 L 314 162.0 L 315 161.5 L 316 160.0 L 317 160.0 L 318 159.0 L 319 161.0 L 320 169.0 L 321 175.5 L 322 182.0 L 323 186.0 L 324 194.5 L 325 202.5 L 326 211.0 L 327 215.5 L 328 219.0 L 329 221.0 L 330 220.0 L 331 218.0 L 332 214.0 L 333 209.5 L 334 203.0 L 335 196.0 L 336 188.5 L 337 182.5 L 338 176.0 L 339 171.0 L 340 164.5 L 341 160.0 L 342 158.0 L 343 159.0 L 344 159.5 L 345 160.0 L 346 160.5 L 347 160.5 L 348 160.5 L 349 160.5 L 350 160.5 L 351 161.0 L 352 161.0 L 353 161.0";

export const AnimatedHeartECG: React.FC<AnimatedHeartECGProps> = ({ className = '', theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Soft Ambient Cardiac Glow */}
      <div className={`absolute w-60 h-60 rounded-full blur-3xl -z-10 animate-cardiac-aura pointer-events-none ${
        isLight ? 'bg-rose-500/15' : 'bg-rose-600/20'
      }`} />

      {/* SVG Canvas rendering the exact artwork: Beating heart in middle, line flowing in exact sequence without vibration */}
      <svg
        viewBox="0 0 380 240"
        className="w-full max-w-[340px] sm:max-w-[440px] h-auto overflow-visible"
        aria-label="WellBeing Animated Heart and ECG Wave"
      >
        <defs>
          {/* Medical Glow Filter for ECG Wave */}
          <filter id="ecg-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base ECG Paths: Always visible in exact sequence, NO vibration */}
        <path
          d={LEFT_PATH}
          fill="none"
          stroke={isLight ? "#e11d48" : "#f43f5e"}
          strokeWidth={isLight ? "3.2" : "2.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isLight ? "0.45" : "0.32"}
        />
        <path
          d={RIGHT_PATH}
          fill="none"
          stroke={isLight ? "#e11d48" : "#f43f5e"}
          strokeWidth={isLight ? "3.2" : "2.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isLight ? "0.45" : "0.32"}
        />

        {/* 2. Active Flowing Lines: Moves in exact sequence from left into heart, and from heart to right */}
        <path
          d={LEFT_PATH}
          fill="none"
          stroke="#ff2a5f"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ecg-stream-left"
          filter="url(#ecg-glow)"
        />
        <path
          d={RIGHT_PATH}
          fill="none"
          stroke="#ff2a5f"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ecg-stream-right"
          filter="url(#ecg-glow)"
        />

        {/* 3. Center Anatomical Heart: Beats continuously in the middle */}
        <g transform="translate(192, 121)">
          <image
            href={heartCenterImg}
            x="-66"
            y="-101"
            width="132"
            height="202"
            className="animate-heart-beat cursor-pointer"
          />
        </g>
      </svg>
    </div>
  );
};
