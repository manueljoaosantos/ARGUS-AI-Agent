# ARGUS AI System

## Visão Geral
O Argus é uma plataforma de observabilidade e automação baseada em IA (AI-native), integrando múltiplas camadas: backend, automação, workflows de IA e dispositivos IoT.

## Arquitetura
- Backend: Node.js (APIs e lógica central)
- Frontend: interface web (servida localmente)
- Automação: n8n
- AI Workflows: Flowise
- Firmware: ESP32 (Arduino C++)
- Comunicação: MQTT / HTTP

## Componentes do Sistema
O Argus é composto por múltiplos serviços independentes:

- Backend (Node.js): responsável por APIs, integração e lógica central
- n8n: responsável por automação e execução de workflows
- Flowise: responsável por lógica de IA e decision making
- ESP32: responsável por sensores e atuadores (tempo real)

## Princípios
- Todas as tools devem estar registadas no backend ou sistema apropriado
- As APIs devem ser tipadas e documentadas
- Nenhuma alteração deve quebrar funcionalidades existentes
- Preferir componentes modulares e reutilizáveis
- O sistema deve ser desacoplado sempre que possível

## Objetivos
- Manter o sistema escalável
- Manter o agent extensível
- Integrar automação (n8n) com IA (Flowise)
- Suportar dispositivos IoT (ESP32)
- Permitir evolução incremental do sistema

## Convenções
- Código limpo e legível
- Seguir a estrutura existente do projeto
- Evitar duplicação de lógica
- Garantir consistência entre serviços
- Usar nomes claros e descritivos

## Regras do Sistema
- Backend é a source of truth
- n8n executa automações e orquestra eventos
- Flowise gere decisões baseadas em IA
- ESP32 trata sensores e atuadores em tempo real

## Regras de Distribuição de Lógica
- Lógica de automação → deve estar no n8n
- Lógica de decisão com IA → deve estar no Flowise
- Lógica de integração e APIs → deve estar no backend
- Interação com hardware → deve estar no ESP32

Evitar concentrar toda a lógica no backend.

## Comunicação
- Preferir MQTT para comunicação com dispositivos IoT
- Usar HTTP/REST para integração entre serviços
- Os serviços devem comunicar de forma desacoplada

## Desenvolvimento
- Alterações devem ser pequenas e incrementais
- Sempre validar impacto em:
  - backend
  - n8n flows
  - Flowise workflows
  - firmware ESP32
- Preferir soluções simples antes de complexidade desnecessária

## Boas Práticas
- Não duplicar lógica entre serviços
- Manter separação clara de responsabilidades
- Garantir que cada componente faz apenas o seu papel
- Preparar o sistema para falhas parciais

## Notas
- O sistema deve continuar a funcionar mesmo que um componente falhe
- O ESP32 não deve depender do backend para operações críticas
- O backend deve poder evoluir independentemente do firmware
- n8n e Flowise devem ser facilmente modificáveis sem impacto global