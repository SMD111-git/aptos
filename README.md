# 🎓 Aptos Skill Passport DApp

A decentralized skill verification and credential management system built on Aptos blockchain. Students can manage their academic achievements, professional profiles, and verified badges, while colleges can issue verifiable credentials.

## 🌟 Features

### For Students
- ✅ **Profile Management** - Build comprehensive professional profiles
- ✅ **Skill Badges** - Collect verified and self-claimed skill badges
- ✅ **Document Storage** - Upload resume, certificates, and projects
- ✅ **Social Links** - Connect GitHub, HackerRank, LinkedIn, LeetCode
- ✅ **Wallet Integration** - Manage APT tokens and transactions
- ✅ **Achievement Tracking** - Showcase accomplishments

### For Admins (Colleges)
- ✅ **Student Record Management** - Upload and manage student data
- ✅ **Document Uploads** - Store marksheets and certificates
- ✅ **Badge Issuance** - Issue verified skill badges on-chain
- ✅ **Access Control** - Role-based permissions

### Blockchain Features
- 🔐 **Verified Badges** - Tamper-proof skill credentials as NFTs
- 🌐 **Decentralized Storage** - On-chain badge metadata
- 🔑 **Wallet Authentication** - Petra/Martian wallet support
- 📜 **Event Logging** - Transparent transaction history

## 🏗️ Tech Stack

### Frontend
- React + TypeScript
- Tailwind CSS
- Aptos Wallet Adapter
- Vite

### Smart Contract
- Move Language (Aptos)
- Aptos Framework

### Storage
- LocalStorage (demo)
- IPFS (planned for production)

## 📦 Installation

### Prerequisites
```bash
# Install Node.js (v18+)
node --version

# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
aptos --version
```

### Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### Setup Move Contract
```bash
cd move
aptos move compile --named-addresses skill_passport_addr=default
aptos move test
```

## 🚀 Deployment

### 1. Deploy Smart Contract

```bash
# Initialize Aptos account
aptos init --profile devnet --network devnet

# Fund account
aptos account fund-with-faucet --profile devnet

# Deploy contract
cd move
aptos move publish --profile devnet --named-addresses skill_passport_addr=devnet

# Initialize contract
aptos move run \
  --function-id <CONTRACT_ADDR>::skill_passport::initialize \
  --profile devnet
```

### 2. Configure Frontend

Create `.env` in frontend folder:
```env
VITE_CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>
VITE_NETWORK=devnet
VITE_NODE_URL=https://fullnode.devnet.aptoslabs.com
```

### 3. Start Application

```bash
cd frontend
npm run dev
```

## 📖 Usage Guide

### For Students

1. **Register**
   - Click "Register here" on login page
   - Select "Student" role
   - Fill in details (name, email, roll number)
   - Create password

2. **Login**
   - Select "Student" role
   - Login with email/password or wallet

3. **Build Profile**
   - Navigate to "My Profile"
   - Add bio, skills, achievements
   - Link GitHub, HackerRank, LinkedIn
   - Upload resume and certificates

4. **View Badges**
   - Check dashboard for issued badges
   - Download certificates
   - View verified vs self-claimed badges

### For Admins

1. **Register as Admin**
   - Select "Admin" role during registration
   - Provide college email

2. **Upload Student Records**
   - Navigate to Admin Dashboard
   - Fill student details
   - Upload documents and marksheets
   - Save records

3. **Issue Badges** (Coming Soon)
   - Select student
   - Choose skill and level
   - Mint verified badge on-chain

## 🔧 Smart Contract Functions

### Initialize
```bash
aptos move run \
  --function-id <ADDR>::skill_passport::initialize \
  --profile <PROFILE>
```

### Add Verifier
```bash
aptos move run \
  --function-id <ADDR>::skill_passport::add_verifier \
  --args address:<VERIFIER> address:<CONTRACT_ADDR> \
  --profile <PROFILE>
```

### Mint Verified Badge
```bash
aptos move run \
  --function-id <ADDR>::skill_passport::mint_verified_badge \
  --args \
    address:<CONTRACT_ADDR> \
    address:<STUDENT> \
    string:"Python" \
    string:"Advanced" \
    string:"College XYZ" \
    u64:0 \
    string:"ipfs://..." \
  --profile <PROFILE>
```

### View Badges
```bash
aptos move view \
  --function-id <ADDR>::skill_passport::get_badges_by_owner \
  --args address:<CONTRACT_ADDR> address:<STUDENT>
```

## 📂 Project Structure

```
my-aptos-dapp/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   ├── StudentPage.tsx
│   │   │   ├── StudentProfilePage.tsx
│   │   │   ├── WalletPage.tsx
│   │   │   ├── Header.tsx
│   │   │   └── TopBanner.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── move/
│   ├── sources/
│   │   └── skill_passport.move
│   ├── tests/
│   │   └── skill_passport_test.move
│   └── Move.toml
├── scripts/
│   ├── deploy.sh
│   └── initialize.sh
└── README.md
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Smart Contract Tests
```bash
cd move
aptos move test
```

## 🔐 Security Considerations

⚠️ **Current Implementation is for Demo/Development**

For Production:
- [ ] Implement secure backend API
- [ ] Add JWT authentication
- [ ] Use IPFS/Arweave for file storage
- [ ] Add rate limiting
- [ ] Implement access control on backend
- [ ] Add input sanitization
- [ ] Enable HTTPS
- [ ] Add audit logging
- [ ] Implement password hashing (bcrypt/argon2)

## 🛣️ Roadmap

- [ ] Backend API (Node.js/Express)
- [ ] IPFS Integration for documents
- [ ] Email verification
- [ ] Multi-signature badge issuance
- [ ] Public profile URLs
- [ ] Badge marketplace
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Aptos Foundation for blockchain infrastructure
- Move language documentation
- React and Tailwind communities

## 📞 Support

For issues and questions:
- GitHub Issues: [Create Issue]
- Email: support@example.com

---

**Built with ❤️ on Aptos Blockchain**
