# 🚀 Cài đặt React Native Slider

## Cài đặt thư viện

```bash
npm install @react-native-community/slider
```

## Cho iOS (nếu cần)

```bash
cd ios && pod install && cd ..
```

## Kiểm tra cài đặt

Sau khi cài đặt, restart Metro bundler:

```bash
npm start -- --reset-cache
```

## Sử dụng

```typescript
import Slider from '@react-native-community/slider';

<Slider
  style={{width: 200, height: 40}}
  minimumValue={50}
  maximumValue={150}
  value={currentSpeed}
  onValueChange={(value) => setSpeed(value)}
  step={10}
  minimumTrackTintColor="#4CAF50"
  maximumTrackTintColor="#ddd"
/>
```

## Troubleshooting

Nếu gặp lỗi import, thử:

1. Restart Metro: `npm start -- --reset-cache`
2. Clear cache: `npx expo start -c`
3. Reinstall: `rm -rf node_modules && npm install` 