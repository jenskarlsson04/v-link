import { useState, useEffect, useRef } from 'react';

import { theme } from './theme/Theme';
import styled, { ThemeProvider, StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid'; // Import isPropValid

import { APP, MMI, KEY } from './store/Store';
import { Socket } from './socket/Socket';

import Splash from './app/Splash';
import Content from './app/Content';

import Carplay from './carplay/Carplay';
import Cardata from './cardata/Cardata';

import './App.css';
import './theme/fonts.module.css';

const AppContainer = styled.div`
  position: absolute;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0D0D0D, #1C1C1C);
`;

function App() {
  const mmi = MMI((state) => state);
  const key = KEY((state) => state);
  const app = APP((state) => state);

  const system = app.system;

  const [commandCounter, setCommandCounter] = useState(0);
  const [keyCommand, setKeyCommand] = useState('');

  useEffect(() => {
    document.addEventListener('keydown', mmiKeyDown);
    return () => {
      document.removeEventListener('keydown', mmiKeyDown);
    };
  }, []);

  const mmiKeyDown = (event: KeyboardEvent) => {
    // Store last Keystroke in store to broadcast it
    key.setKeyStroke(event.code);

    // Check if a key for switching the pages was assigned
    if (system.switch) {

      // If user is not switching the page, send control to CarPlay
      if (event.code !== system.switch && system.view === 'Carplay') {
        if (Object.values(mmi!.bindings).includes(event.code)) {
          const action = Object.keys(mmi!.bindings).find(key =>
            mmi!.bindings[key] === event.code
          );
          //console.log(action)
          if (action !== undefined) {
            setKeyCommand(action);
            setCommandCounter(prev => prev + 1);
            if (action === 'selectDown') {
              setTimeout(() => {
                setKeyCommand('selectUp');
                setCommandCounter(prev => prev + 1);
              }, 200);
            }
          }
        }
      }
    }
  };

  // Dimensions of the container
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  /* Observe container resizing and update dimensions. */
  useEffect(() => {
    const handleResize = () => {
      if(containerRef.current)
      if (containerRef.current && system.startedUp) {

        const carplayFullscreen = containerRef.current.offsetHeight;
        const carplayWindowed = containerRef.current.offsetHeight - app.settings.side_bars.topBarHeight.value;

        console.log(carplayFullscreen, carplayWindowed, app.settings.side_bars.dashBar.value);

        app.update((state) => {
          state.system.windowSize.width = containerRef.current.offsetWidth;
          state.system.windowSize.height = containerRef.current.offsetHeight;

          state.system.carplaySize.width = containerRef.current.offsetWidth;
          state.system.carplaySize.height = (app.settings.side_bars.dashBar.value ? carplayFullscreen : carplayWindowed);
        });

        setReady(true);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [system.startedUp, containerRef.current]);

  return (
    <StyleSheetManager shouldForwardProp={isPropValid}>
      <AppContainer ref={containerRef}>
        <Socket />
        <Cardata />
        <Splash />

        {system.startedUp ? (
          <ThemeProvider theme={theme}>
            {ready && <Carplay
              commandCounter={commandCounter}
              command={keyCommand}
            />}
            {<Content />}
          </ThemeProvider>
        ) : (
          <></>
        )}
      </AppContainer>
    </StyleSheetManager>
  );
}

export default App;
