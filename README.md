# PharmaGuard – AI-Powered Pharmacogenomics Platform

---

## Project Overview

PharmaGuard is an AI-powered web application that analyzes human genomic VCF files and predicts personalized drug response risks using pharmacogenomics principles and CPIC guidelines.

The system identifies key genetic variants, maps them to drug metabolism pathways, and generates clinically actionable recommendations with AI-generated explanations.

This project aims to reduce adverse drug reactions and improve patient safety through precision medicine.

---

## 🌐 Live Demo

🔗 https://rift-testing.vercel.app/

---

## Problem Statement

Adverse drug reactions cause significant morbidity and mortality worldwide. Many of these reactions are preventable through pharmacogenomic testing.

PharmaGuard solves this problem by:

- Parsing genomic VCF files
- Identifying drug-related genetic variants
- Applying CPIC clinical guidelines
- Predicting drug risks
- Providing explainable AI-based reports

---


## System Architecture

Frontend (React + Tailwind CSS)  
→ Backend API (FastAPI)  
→ VCF Parser (cyvcf2)  
→ Variant Annotation Engine  
→ CPIC Rules Engine  
→ Risk Classification Module  
→ LLM Explanation Engine  
→ Result Dashboard

---

A Vite + React + TypeScript project with TailwindCSS, Shadcn UI, and Supabase integration

---

## 🚀 Tech Stack

- React (with Vite)
- TypeScript
- TailwindCSS
- Shadcn UI
- Supabase
- Vitest (Testing)

---

## 📂 Project Structure

root/
│
├── public/
├── src/
│ ├── components/
│ ├── hooks/
│ ├── integrations/
│ ├── lib/
│ ├── pages/
│ └── App.tsx
│
├── supabase/
│ ├── functions/
│ └── config.toml
│
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json


---

### Deployment
- VERCEL

---

## Supported Genes

The system analyzes variants in the following pharmacogenomic genes:

- CYP2D6
- CYP2C19
- CYP2C9
- SLCO1B1
- TPMT
- DPYD

---

## Features

- Upload and validate VCF files
- Multi-drug analysis support
- CPIC-aligned dosing recommendations
- Color-coded risk visualization
- AI-generated clinical explanations
- JSON export and copy functionality
- Error handling and validation

---

## ⚙️ Prerequisites

Make sure you have installed:

- Node.js (v18 or higher recommended)
- npm or bun
- Git

Check versions:

```bash
node -v
npm -v
```

---
## 📦 Installation Guide

Clone the repository:

```
git clone https://github.com/CodeWithAnkitJaiswal/rift-testing.git
```

Navigate into project:

```
cd rift-testing
```

Install dependencies:

```
npm install
```

Start the development server:

```
npm run dev
```

App will run at:

```
http://localhost:5173
```
