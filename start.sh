#!/bin/bash

# Este script inicia tanto o frontend quanto o backend simultaneamente
# usando o pacote 'concurrently' que já está configurado no package.json.

echo "=========================================="
echo " Iniciando o Frontend e o Backend..."
echo "=========================================="

# Instala as dependências caso ainda não estejam instaladas (opcional)
# npm install

# Executa o script dev:full definido no package.json
npm run dev:full
