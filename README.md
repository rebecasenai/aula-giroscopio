# Aula de Giroscópio — React Native & Expo Sensors

Este projeto é uma aplicação desenvolvida com **React Native** e **Expo** para demonstrar o uso prático de sensores de hardware do smartphone (especificamente o **Giroscópio** via `expo-sensors`), evoluindo desde a leitura bruta de dados até um minigame arcade com física e inércia ("Coleta de Orbes").

---

## Estrutura do Projeto

O projeto é modularizado em 3 componentes principais localizados na pasta `components/`:

1. **`LeituraGiroscopio.tsx` (Básico):**
   * Exibe na tela os valores dos eixos **X**, **Y** e **Z** em tempo real com formatação decimal limpa.
   * Totalmente comentado linha por linha para fins didáticos.

2. **`OrbeFlutuante.tsx` (Intermediário):**
   * Uma esfera que se move pela tela de acordo com a rotação do aparelho.
   * Implementa contenção dentro dos limites da tela (*screen bounds*).

3. **`JogoColeteOrbe.tsx` — Coleta de Orbes (Avançado / Minigame):**
   * Jogo interativo onde o jogador controla uma esfera laranja para coletar o orbe azul (`#0ea5e9`).
   * **Motor de física:** Inércia, velocidade acumulada, atrito e rebote nas paredes (*bounce*).
   * **Gameplay:** Contagem direta de orbes coletados, recorde (*High Score*), botão de reiniciar e suporte a toque (*fallback* para emuladores).

---

## Bugs Identificados e Soluções Implementadas

Abaixo está o comparativo detalhado dos problemas presentes no código inicial e como foram corrigidos:

### 1. Tela em branco / Colapso de layout no `app/index.tsx`
* **Problema:** O componente principal no `app/index.tsx` estava envolvido por uma `<View>` sem estilo (`flex: 1`). No React Native, Views sem restrição de tamanho colapsam a altura para zero, fazendo com que nada aparecesse na tela.
* **Solução:** Adicionado `style={{ flex: 1 }}` na View raiz para que o componente ocupe a tela inteira do dispositivo.

---

### 2. Movimento travado pelo intervalo de atualização (`500ms`)
* **Problema:** O sensor estava configurado com `Gyroscope.setUpdateInterval(500)`. Isso fazia o giroscópio enviar dados apenas **2 vezes por segundo** (2 FPS), resultando em uma movimentação extremamente travada e sensação de "app congelado".
* **Solução:** O intervalo foi reduzido para `16ms` ~ `20ms` (50 a 60 leituras por segundo), permitindo animações fluidas.

---

### 3. Movimentação robótica / Bolinha congelava sem rotação contínua
* **Problema:** O giroscópio mede **velocidade angular** (radianos por segundo), e não inclinação estática. Assim que o usuário parava de girar o aparelho, o sensor retornava `0` e a bolinha estancava imediatamente no lugar.
* **Solução:** Implementado um **motor de física com inércia e atrito**:
  ```ts
  // Aceleração baseada no giroscópio + atrito (0.93) para deslize natural
  vel.vx = (vel.vx - gyro.y * accel) * 0.93;
  vel.vy = (vel.vy - gyro.x * accel) * 0.93;
  ```
  Agora a esfera acelera com o movimento e desliza suavemente como uma bola de gude.

---

### 4. Travamento seco nas bordas da tela
* **Problema:** Ao atingir as bordas da tela, a posição simplesmente travava em zero ou no limite máximo, cortando a sensação de dinamismo.
* **Solução:** Adicionado efeito de **rebote (*bounce*)**:
  ```ts
  if (nextX <= minX || nextX >= maxX) {
    vel.vx = -vel.vx * 0.5; // Inverte a direção e absorve 50% do impacto
  }
  ```

---

### 5. Spawn do orbe fora da tela e colisão imprecisa
* **Problema:** 
  1. A função `generateRandomPosition` usava `Math.random() * width`, o que podia gerar o orbe cortado na borda ou escondido atrás do texto de cabeçalho.
  2. A distância de colisão comparava `distance < PLAYER_SIZE + ORB_SIZE` (soma dos diâmetros em vez dos raios), ativando a coleta antes mesmo das esferas se tocarem.
* **Solução:**
  1. Área de spawn limitada com margens de segurança para cabeçalho e rodapé.
  2. Colisão calculada pela soma dos **raios** com Teorema de Pitágoras:
     $$\text{distância} = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2} < (r_1 + r_2)$$

---

### 6. Tratamento de `-0.0` no componente de leitura
* **Problema:** O método `.toFixed(1)` em números negativos muito próximos de zero exibia `-0.0` na tela.
* **Solução:** Adicionada verificação ternária para normalizar `-0` para `0`:
  ```tsx
  <Text>x: {x.toFixed(1) === '-0.0' || x.toFixed(1) === '-0' ? 0 : x.toFixed(1)}</Text>
  ```

---

### 7. Prevenção de Vazamento de Memória (*Memory Leaks*)
* **Problema:** Se os ouvintes (*listeners*) do hardware não forem destruídos, eles continuam rodando em segundo plano após sair da tela, esgotando a bateria e gerando erros no React.
* **Solução:** Utilização rigorosa da **função de limpeza (*cleanup*)** no retorno do `useEffect`:
  ```tsx
  useEffect(() => {
    const subscription = Gyroscope.addListener(data => { ... });
    return () => {
      subscription && subscription.remove();
    };
  }, []);
  ```

---

## Conceitos de React Native Explicados

| Conceito | O que faz no projeto? |
| :--- | :--- |
| **`useState`** | Armazena dados reativos (posição da bola, pontuação, leitura do sensor). Quando atualizado via `set...`, redesenha a tela automaticamente. |
| **`useEffect`** | Executa efeitos colaterais: ativa o sensor do giroscópio e inicia o loop do jogo. |
| **`return () => subscription.remove()`** | Função de limpeza (*cleanup*). Desliga o sensor quando o componente sai da tela. |
| **Array de dependências `[]`** | Garante que o sensor seja configurado **apenas uma vez** na montagem inicial da tela. |
| **`requestAnimationFrame` + `useRef`** | Permite que a física do jogo rode a 60 FPS sem engasgos de re-renderização do React. |

---

## Como Executar o Projeto

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor Expo:**
   ```bash
   npx expo start
   ```

3. **Abrir no dispositivo:**
   * Instale o aplicativo **Expo Go** no seu smartphone Android ou iOS.
   * Escaneie o QR Code exibido no terminal.
   * Certifique-se de que o computador e o celular estejam na **mesma rede Wi-Fi**.

> **Observação:** Sensores como o Giroscópio dependem do hardware físico do smartphone. Ao testar no emulador do PC, utilize o modo de arrastar o dedo na tela (*PanResponder*) ou os sensores virtuais do Android Studio / Xcode.
