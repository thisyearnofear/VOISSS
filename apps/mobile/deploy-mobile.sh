#!/bin/bash

# VOISSS Mobile Deployment Script for Hackathon
# This script deploys the mobile app for judge testing

echo "🚀 VOISSS Mobile Deployment for Hackathon"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: Please run this script from the apps/mobile directory"
    exit 1
fi

# Install EAS CLI if not present
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo authentication..."
eas whoami || eas login

# Configure EAS if not already done
if [ ! -f "eas.json" ]; then
    echo "⚙️ Configuring EAS build..."
    eas build:configure
fi

# Create EAS configuration for hackathon
cat > eas.json << EOF
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

echo "🔨 Building preview version for judges..."
eas build --platform all --profile preview --non-interactive

echo "📱 Publishing to Expo Go for instant access..."
npx expo publish

echo "🌐 Building web version..."
npx expo export:web

echo "✅ Mobile deployment complete!"
echo ""
echo "📋 Access Information for Judges:"
echo "================================="
echo "• Expo Go: Search 'voisss-mobile' in Expo Go app"
echo "• Web Version: Available in dist/ folder"
echo "• QR Code: Check the Expo dashboard for QR code"
echo ""
echo "🔗 Share this with judges:"
echo "exp://exp.host/@your-username/voisss-mobile"
echo ""
echo "📱 For iOS/Android testing:"
echo "Download Expo Go app and scan the QR code from Expo dashboard"