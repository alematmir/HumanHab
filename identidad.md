Arquitectura General
HumanHab es dark-first, con soporte completo en light mode.
El sistema se compone de:
🔵 Azul estructural (core)
🟣 Indigo mental (acento)
⚪ Neutros cognitivos (estructura invisible)
🟢🟠🔴 Estados funcionales (uso restringido)
Regla macro:
70% neutros
20% azul estructural
5–10% acento
<5% estados
El color nunca domina.
La jerarquía domina.
2️⃣ Escala Azul — Estructura Principal
Uso: fondos, superficies, estructura, bloques.
Nivel	HEX	Uso
900	#0F1C2E	Fondo dark principal
800	#16263F	Superficie elevada
700	#1E2F52	Header / contenedores
600	#27406E	Botones secundarios dark
500	#35558E	Elementos interactivos light
400	#4C6DAA	Hover light
300	#6E8FC4	Fondo informativo
200	#A5BEDF	Fondo suave
100	#DCE6F4	Fondo alternativo light
50	#F3F6FB	Background general light
Reglas técnicas
Variación principal en luminosidad, no en matiz.
Al aclarar → reducir levemente saturación.
Diferencia entre escalones: 8–15% de lightness.
No usar Azul 900 para texto largo.
3️⃣ Escala Indigo — Acento Mental
Uso: acciones primarias, foco, estados activos.
Nivel	HEX	Uso
700	#3F3696	Pressed
600	#4B42B2	Botón primario
500	#5C53C9	Hover
400	#7A73D9	Highlight
300	#A9A5EA	Fondo activo leve
Reglas técnicas
No más de 5 niveles.
Nunca más del 10% del layout.
No usar como fondo dominante.
No usar en texto largo.
El acento guía. No protagoniza.
4️⃣ Sistema Neutro — Cognitivo
Uso: texto, fondos light, divisores, respiración visual.
Nivel	HEX	Uso
900	#1A1A1A	Texto primario light
800	#2B2B2B	Texto fuerte
700	#404040	Texto secundario fuerte
600	#5A5A5A	Texto secundario
500	#737373	Labels
400	#9A9A9A	Texto terciario
300	#C2C2C2	Bordes
200	#E2E2E2	Divisores
100	#F2F2F2	Cards light
50	#FAFAFA	Background light
Reglas técnicas
Totalmente neutros (sin dominante azul).
El gris gobierna la interfaz.
El contraste se construye con gris + peso tipográfico.
5️⃣ Estados Funcionales
Uso restringido y funcional.
Estado	HEX
Success	#2F7A5F
Warning	#B07A2F
Error	#A33A3A
Info	#2E5B9F
Reglas
Ligeramente desaturados.
Nunca usar en grandes superficies.
Solo para feedback funcional.
6️⃣ Dark Mode — Configuración Base
Fondo principal → Azul 900
Superficie → Azul 800
Card → Azul 700
Border → Gray 700
Texto primario → Gray 50
Texto secundario → Gray 300
Botón primario → Indigo 600
Regla:
Nunca usar negro puro (#000000).
7️⃣ Light Mode — Configuración Base
Fondo principal → Gray 50
Superficie → Gray 100
Card → Blanco o Gray 50
Texto primario → Gray 900
Texto secundario → Gray 600
Botón primario → Indigo 600
Elementos estructurales → Azul 600–700
8️⃣ Accesibilidad
Cumplir mínimo WCAG AA:
Texto normal → 4.5:1
Texto grande → 3:1
Botones → contraste mínimo 4.5:1 contra fondo
HumanHab habla de optimización.
La accesibilidad no es opcional.
9️⃣ Prohibiciones
No usar:
Gradientes intensos.
Glow.
Saturación alta.
Mezcla azul–verde tipo wellness.
Más de 3 colores simultáneos en un mismo bloque.
🔟 Principio Rector Cromático
El sistema debe sentirse:
Controlado.
Proporcional.
Con respiración.
Sin dramatismo.
Sin estímulo innecesario.
Si el color llama demasiado la atención,
está mal aplicado.
Con esto ya tenés:
Identidad conceptual.
Sistema cromático formal.
Reglas operativas.
Lógica dark/light.
Límites claros.
Si querés, el siguiente paso técnico sería convertir esto en:
Tokens de diseño (para código).
Variables CSS.
O especificación para Figma.