# Jogo do Giroscópio — React Native

Aplicativo que utiliza o sensor de giroscópio do celular para movimentar bolinhas na tela conforme você inclina e gira o aparelho.

---

## Como Funciona o Jogo

* **Controle por Movimento:** Incline o celular para qualquer direção para mover a sua esfera.
* **Objetivo:** Encoste a sua esfera na bolinha alvo para coletá-la e somar pontos.
* **Cores do Arco-Íris:** A cada bolinha coletada, as cores mudam seguindo a sequência do arco-íris (vermelho, laranja, amarelo, verde, ciano, azul, violeta e rosa).
* **Recorde:** O jogo salva a sua maior pontuação da partida.

---

## O que tem no Projeto

1. **Leitura do Sensor (`components/LeituraGiroscopio.tsx`):**
   Tela simples que mostra os números exatos da movimentação do celular nos eixos X, Y e Z.

2. **Bolinha Flutuante (`components/OrbeFlutuante.tsx`):**
   Uma bolinha que desliza pela tela acompanhando a inclinação do aparelho sem sair das bordas.

3. **Jogo Completo (`components/JogoColeteOrbe.tsx`):**
   O jogo interativo com física suave, pontuação, troca de cores e botão para reiniciar.

---

## Como Testar no Celular

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o projeto:
   ```bash
   npx expo start
   ```

3. Abra no celular:
   * Baixe o aplicativo **Expo Go** na Google Play Store (Android) ou App Store (iOS).
   * Escaneie o QR Code que aparece no terminal ou no navegador.
   * Certifique-se de que o celular e o computador estão conectados na mesma rede Wi-Fi.
