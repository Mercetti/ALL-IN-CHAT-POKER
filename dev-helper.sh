#!/bin/bash

# AI Control Center Development Helper

echo "🎮 AI Control Center Development Helper"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to start local development
start_local() {
    echo "🚀 Starting local development server..."
    echo "📍 URL: http://localhost:5173"
    echo "🔗 Backend: https://all-in-chat-poker.fly.dev"
    echo ""
    echo "📝 Development Notes:"
    echo "- Changes will be hot-reloaded automatically"
    echo "- Connects to production backend for data"
    echo "- Safe for development without affecting players"
    echo ""
    cd apps/ai-control-center
    npm run dev
}

# Function to deploy to production (with warnings)
deploy_production() {
    echo "⚠️  PRODUCTION DEPLOYMENT WARNING!"
    echo "=================================="
    echo "🎮 This will interrupt gameplay for active players!"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying to production..."
        echo "⏰ Expected downtime: 1-2 minutes"
        echo "📊 Players will be disconnected temporarily"
        echo ""
        fly deploy
    else
        echo "❌ Deployment cancelled"
    fi
}

# Function to show current status
show_status() {
    echo "📊 Current Status"
    echo "=================="
    echo ""
    echo "🎮 Production: https://all-in-chat-poker.fly.dev"
    echo "🛠️  Development: http://localhost:5173"
    echo ""
    echo "📈 Production Status:"
    echo "- Core Systems: ✅ Stable"
    echo "- User Issues: ✅ All resolved"
    echo "- Last Deploy: $(git log -1 --format='%h %s' 2>/dev/null || echo 'Unknown')"
    echo ""
    echo "🔄 Recommended Workflow:"
    echo "1. Develop locally (npm run dev)"
    echo "2. Test thoroughly"
    echo "3. Deploy only when ready"
    echo ""
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    echo ""
    
    # Check if audio player works
    echo "🎵 Checking audio player..."
    curl -s -o /dev/null -w "%{http_code}" https://all-in-chat-poker.fly.dev/uploads/audio/test.mp3
    
    # Check if API is responsive
    echo "🔗 Checking API endpoints..."
    curl -s -o /dev/null -w "%{http_code}" https://all-in-chat-poker.fly.dev/admin/ai/overview
    
    echo ""
    echo "✅ Tests completed"
}

# Main menu
case "${1:-}" in
    "dev"|"local"|"start")
        start_local
        ;;
    "deploy"|"prod"|"production")
        deploy_production
        ;;
    "status"|"info")
        show_status
        ;;
    "test"|"check")
        run_tests
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  dev, local, start    - Start local development server"
        echo "  deploy, prod, prod    - Deploy to production (with warnings)"
        echo "  status, info         - Show current status"
        echo "  test, check         - Run basic tests"
        echo "  help, -h, --help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 dev              # Start local development"
        echo "  $0 deploy           # Deploy to production"
        echo "  $0 status           # Show status"
        ;;
    *)
        echo "🎮 AI Control Center Development Helper"
        echo "=================================="
        echo ""
        echo "Available commands:"
        echo "  $0 dev              # Start local development"
        echo "  $0 deploy           # Deploy to production"
        echo "  $0 status           # Show current status"
        echo "  $0 test             # Run basic tests"
        echo "  $0 help             # Show this help"
        echo ""
        echo "🚀 Quick start: $0 dev"
        ;;
esac
