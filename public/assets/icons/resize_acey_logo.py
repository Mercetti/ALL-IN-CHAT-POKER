#!/usr/bin/env python3
"""
Acey Logo Resizing Script
Automatically resize Acey logo to all required sizes for mobile and web apps
"""

import os
from PIL import Image
import sys

def resize_logo(source_path, output_dir):
    """Resize Acey logo to all required sizes"""
    
    # Define required sizes for different platforms
    sizes = {
        # Web/PWA Icons
        'acey-logo-16.png': (16, 16),
        'acey-logo-32.png': (32, 32),
        'acey-logo-96.png': (96, 96),
        'acey-logo-128.png': (128, 128),
        'acey-logo-192.png': (192, 192),
        'acey-logo-256.png': (256, 256),
        'acey-logo-384.png': (384, 384),
        'acey-logo-512.png': (512, 512),
        'acey-logo-1024.png': (1024, 1024),
        
        # Mobile App Icons
        'android-mdpi.png': (48, 48),
        'android-hdpi.png': (72, 72),
        'android-xhdpi.png': (96, 96),
        'android-xxhdpi.png': (144, 144),
        'android-xxxhdpi.png': (192, 192),
        
        'ios-60@2x.png': (120, 120),
        'ios-60@3x.png': (180, 180),
        'ios-76@2x.png': (152, 152),
        'ios-83.5@2x.png': (167, 167),
        'ios-1024.png': (1024, 1024),
    }
    
    try:
        # Open the source image
        with Image.open(source_path) as img:
            # Convert to RGBA if not already (for transparency)
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Create output directory if it doesn't exist
            os.makedirs(output_dir, exist_ok=True)
            
            print(f"🎨 Resizing Acey logo from {source_path}")
            print(f"📁 Output directory: {output_dir}")
            print("=" * 50)
            
            # Resize to each required size
            for filename, size in sizes.items():
                try:
                    # Create a copy for resizing
                    resized_img = img.copy()
                    
                    # Resize with high quality
                    resized_img = resized_img.resize(size, Image.Resampling.LANCZOS)
                    
                    # Save the resized image
                    output_path = os.path.join(output_dir, filename)
                    resized_img.save(output_path, 'PNG', optimize=True)
                    
                    print(f"✅ Created {filename} ({size[0]}x{size[1]})")
                    
                except Exception as e:
                    print(f"❌ Error creating {filename}: {e}")
            
            print("=" * 50)
            print(f"🎉 Successfully created {len(sizes)} logo files!")
            
    except FileNotFoundError:
        print(f"❌ Error: Source file not found: {source_path}")
        print("Please make sure the Acey logo file exists.")
    except Exception as e:
        print(f"❌ Error processing image: {e}")

def copy_to_platforms(resized_dir):
    """Copy resized logos to platform-specific directories"""
    
    # Define platform mappings
    platform_mappings = {
        # Android
        'mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.png': 'android-mdpi.png',
        'mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher.png': 'android-hdpi.png',
        'mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png': 'android-xhdpi.png',
        'mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png': 'android-xxhdpi.png',
        'mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': 'android-xxxhdpi.png',
        
        # iOS
        'mobile/ios/AllInChatPoker/Images.xcassets/AppIcon.appiconset/icon-60@2x.png': 'ios-60@2x.png',
        'mobile/ios/AllInChatPoker/Images.xcassets/AppIcon.appiconset/icon-60@3x.png': 'ios-60@3x.png',
        'mobile/ios/AllInChatPoker/Images.xcassets/AppIcon.appiconset/icon-76@2x.png': 'ios-76@2x.png',
        'mobile/ios/AllInChatPoker/Images.xcassets/AppIcon.appiconset/icon-83.5@2x.png': 'ios-83.5@2x.png',
        'mobile/ios/AllInChatPoker/Images.xcassets/AppIcon.appiconset/icon-1024.png': 'ios-1024.png',
        
        # Web/PWA
        'public/favicon.ico': 'acey-logo-32.png',  # Use 32px for favicon
    }
    
    print("📱 Copying logos to platform directories...")
    print("=" * 50)
    
    for platform_path, source_file in platform_mappings.items():
        try:
            source_path = os.path.join(resized_dir, source_file)
            if os.path.exists(source_path):
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(platform_path), exist_ok=True)
                
                # Copy file
                import shutil
                shutil.copy2(source_path, platform_path)
                print(f"✅ Copied to {platform_path}")
            else:
                print(f"⚠️  Source file not found: {source_path}")
                
        except Exception as e:
            print(f"❌ Error copying to {platform_path}: {e}")
    
    print("=" * 50)
    print("🎉 Logo copying complete!")

def main():
    """Main function to run the logo resizing process"""
    
    print("🎰 Acey Logo Resizing Tool")
    print("=" * 50)
    
    # Check if source file is provided
    if len(sys.argv) != 2:
        print("Usage: python resize_acey_logo.py <path_to_acey_logo>")
        print("\nExample:")
        print("python resize_acey_logo.py /path/to/acey-logo.png")
        print("\nSupported formats: PNG, JPG, GIF, BMP")
        return
    
    source_path = sys.argv[1]
    output_dir = "resized_logos"
    
    # Resize the logo
    resize_logo(source_path, output_dir)
    
    # Copy to platform directories
    copy_to_platforms(output_dir)
    
    print("\n🎯 Next Steps:")
    print("1. Check the resized logos in the 'resized_logos' directory")
    print("2. Verify all platform directories have the correct icons")
    print("3. Test the mobile app and web app")
    print("4. Submit to app stores!")

if __name__ == "__main__":
    main()
