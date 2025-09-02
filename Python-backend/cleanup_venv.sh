#!/bin/bash
# Virtual Environment Cleanup Script
# This script helps manage duplicate virtual environments

echo "🧹 Virtual Environment Cleanup Script"
echo "===================================="

# Check current directory
if [ ! -d ".venv" ] || [ ! -d "venv" ]; then
    echo "❌ Error: Both .venv and venv directories not found"
    exit 1
fi

echo "📊 Current virtual environments:"
echo "  .venv: $(du -sh .venv | cut -f1) (created: $(stat -c '%y' .venv | cut -d' ' -f1))"
echo "  venv:  $(du -sh venv | cut -f1) (created: $(stat -c '%y' venv | cut -d' ' -f1))"

echo ""
echo "🔍 Analyzing environments..."

# Check which environment has more packages
VENV_COUNT=$(source .venv/bin/activate && pip list | wc -l)
VENVC_COUNT=$(source venv/bin/activate && pip list | wc -l)

echo "  .venv packages: $VENV_COUNT"
echo "  venv packages:  $VENVC_COUNT"

echo ""
echo "💡 Recommendations:"
echo "1. Keep 'venv' (newer, working environment)"
echo "2. Remove '.venv' (older, problematic environment)"
echo "3. Update .gitignore to ignore both venv/ and .venv/"

echo ""
read -p "🗑️  Remove .venv directory? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing .venv..."
    rm -rf .venv
    echo "✅ .venv removed successfully"
else
    echo "❌ Cleanup cancelled"
fi

echo ""
echo "📝 Next steps:"
echo "1. Always use: source venv/bin/activate"
echo "2. Update .gitignore if needed"
echo "3. Consider adding to .gitignore: venv/
