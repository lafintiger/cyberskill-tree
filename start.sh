#!/bin/bash

echo "🌐 Starting CyberSkill Tree..."
echo ""

docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Initializing database..."
docker-compose exec -T backend python -m app.init_db

echo ""
echo "✅ CyberSkill Tree is ready!"
echo ""
echo "🔗 Access the application:"
echo "   Application: http://localhost:3366"
echo "   API Docs: http://localhost:3366/docs"
echo "   API: http://localhost:3366/api/*"
echo ""
echo "🔑 Default credentials:"
echo "   Admin: admin@cyber.edu / admin123"
echo "   Student: student@cyber.edu / student123"
echo ""
echo "📋 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
echo ""
