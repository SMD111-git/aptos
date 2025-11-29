#!/bin/bash

echo "🚀 Preparing to push Aptos Skill Passport to GitHub"

# Initialize git if not already done
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "Initial commit: Aptos Skill Passport DApp

Features:
- Student profile management
- Admin dashboard for record uploads  
- Wallet integration (Petra/Martian)
- Move smart contract for badge NFTs
- Role-based authentication
- Document upload/download
- Social profile linking
- Skills and achievements tracking"

# Add remote (replace with your GitHub repo URL)
echo "🔗 Adding remote repository..."
echo "Please enter your GitHub repository URL (e.g., https://github.com/username/aptos-skill-passport.git):"
read REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ No repository URL provided. Exiting."
    exit 1
fi

git remote add origin $REPO_URL

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Code successfully pushed to GitHub!"
echo ""
echo "Next steps:"
echo "1. Visit your repository: $REPO_URL"
echo "2. Add repository description"
echo "3. Add topics: aptos, blockchain, move, dapp, nft"
echo "4. Enable GitHub Pages (optional)"
echo "5. Configure branch protection rules"
