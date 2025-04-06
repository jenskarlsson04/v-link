import { useState, useEffect, useRef } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Fade } from '../theme/styles/Effects';

import { APP, KEY } from '../store/Store';

import Dashboard from './pages/dashboard/Dashboard';
import Carplay from './pages/carplay/Carplay';
import Settings from './pages/settings/Settings';
import NavBar from '../app/sidebars/NavBar';
import SideBar from '../app/sidebars/SideBar';
import TopBar from '../app/sidebars/TopBar';

const MainContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  height: ${({ height }) => `${height}px`};
  width: ${({ width }) => `${width}px`};

  pointer-events: ${({ app }) => (app.system.interface.carplay && app.system.view === 'Carplay' ? 'none' : 'auto')};

  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-start;

  box-sizing: border-box;
  padding-top: ${({ app }) => `${app.settings.side_bars.topBarHeight.value}px`};
  padding-left: ${({ app }) => `${app.settings.general.contentPadding.value}px`};
  padding-right: ${({ app }) => `${app.settings.general.contentPadding.value}px`};
  padding-bottom: ${({ app }) => `${app.settings.general.contentPadding.value}px`};
  background: none;
`;



const Card = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  //align-items: stretch;
  justify-content: center;

  overflow: hidden;

  animation: ${({ theme, currentView, carplayVisible, minHeight, maxHeight, collapseLength, stream }) => {
    const delay = stream ? 0 : 2; // Delay in seconds if stream is false
    if (currentView === 'Carplay' && carplayVisible) {
      return css`
        ${theme.animations.getVerticalCollapse(minHeight, maxHeight)} ${collapseLength}s ease-in-out ${delay}s forwards,
        fadeOut ${collapseLength}s ease-in-out ${delay}s forwards;
        padding: 0;
      `;
    } else {
      return css`
        ${theme.animations.getVerticalExpand(minHeight, maxHeight)} ${collapseLength}s ease-in-out forwards,
        fadeIn ${collapseLength}s ease-in-out forwards;
      `;
    }
  }};
  /* Avoid transition conflicts */
  transition: none;
  transform-origin: top;

  @keyframes fadeOut {
    from { opacity: 1;}
    to   { opacity: 0;}
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;



const Page = styled.div`
  position: relative;  
  flex: 1;

  display: flex;
  flex-direction: column;
  
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.gradients.gradient1};

  overflow: hidden;
`;

const NavBlocker = styled.div`
  width: 100%;
  height: ${({ app, isActive }) =>
    isActive
      ? `${app.settings.side_bars.navBarHeight.value - app.settings.general.contentPadding.value}px`
      : '0'};

  animation: ${({ theme, isActive, collapseLength, minHeight, maxHeight }) => css`
    ${isActive
      ? theme.animations.getVerticalExpand(minHeight, maxHeight)
      : theme.animations.getVerticalCollapse(minHeight, maxHeight)} ${collapseLength}s ease-in-out forwards;
  `};

  background: none;
  transition: height 0.3s ease-in-out;
`;



const Content = () => {
  const viewMap = {
    Dashboard: Dashboard,
    Carplay: Carplay,
    Settings: Settings,
  };

  const app = APP((state) => state);
  const key = KEY((state) => state);
  const theme = useTheme();

  const cardPadding = 20;

  /* Get windowSize size */
  const windowSize = { width: window.innerWidth, height: window.innerHeight };

  /* Carplay Logic */
  const fadeLength = 200; //ms
  const collapseLength = 400; //ms
  const [fadePage, setFadePage] = useState('fade-in');
  const [currentView, setCurrentView] = useState(app.system.view);

  useEffect(() => {
    if (app.system.view === 'Carplay' && app.system.interface.carplay) {
      // Case: Navigating to Carplay with carplayVisible true
      setFadePage('fade-out'); // Immediately fade out
      setTimeout(() => {
        setCurrentView(app.system.view); // Set Carplay view after fade-out
        setFadePage('hidden'); // Keep content hidden
        app.update((state) => {
          state.system.interface.content = false; // Disable content
          state.system.interface.navBar = false;
        });
      }, fadeLength); // Match CSS fade-out duration
    } else if (app.system.view === currentView && !app.system.interface.carplay) {
      // Case: app.system.interface.carplay changed to false without view change
      setFadePage('fade-in'); // Fade-in the content
      app.update((state) => {
        state.system.interface.content = true; // Enable content
        state.system.interface.navBar = true;
      });
    } else if (app.system.view !== currentView) {
      // Case: Switching between views normally
      setFadePage('fade-out'); // Trigger fade-out for the current view
      setTimeout(() => {
        setCurrentView(app.system.view); // Switch to the new view
        setFadePage('fade-in'); // Fade-in the new view
        app.update((state) => {
          state.system.interface.content = true; // Enable content
          state.system.interface.navBar = true;
        });
      }, fadeLength); // Match CSS fade-out duration
    }
  }, [app.system.view, app.system.interface.carplay]);



  useEffect(() => {
    if (app.system.carplay.connected && app.system.carplay.worker) {
      app.update((state) => {
        state.system.interface.carplay = true;
      });
    }
    else
      app.update((state) => {
        state.system.interface.carplay = false;
      });
  }, [app.system.carplay])


  /* NavBar Logic */
  const timerRef = useRef(null); // Store the timer ID
  const [navActive, setNavActive] = useState(true)
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (app.system.view === 'Settings') {
      app.update((state) => {
        state.system.interface.navBar = true;
      });
      clearTimeout(timerRef.current);
      return;
    }

    if (app.system.interface.navBar) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        app.update((state) => {
          state.system.interface.navBar = false;
        });
      }, 4000);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [app.system.view, app.system.interface.navBar]);

  const handleClick = (event) => {
    console.log('click')
    if (app.system.view != 'Settings' && checkMouseY(event.clientY)) {
      app.update((state) => {
        state.system.interface.navBar = true;
      })
    }
  };

  const checkMouseY = (mouseY) => {
    const deadZone = 85; // Percentage
    if (mouseY > window.innerHeight * (deadZone / 100)) {
      return true;
    } else
      return false;
  }

  // Mouse position check to update isHovering state
  useEffect(() => {
    const handleMouseMove = (event) => {
      setIsHovering(checkMouseY(event.clientY))
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);



  /* Render Pages */
  const renderView = () => {
    const Component = viewMap[currentView];
    if (!Component) {
      console.error(`Component for view "${currentView}" is undefined.`);
      return null;
    }
    return <Component />;
  };

  useEffect(() => {
    app.update((state) => {
      state.system.switch = app.settings.app_bindings.switch.value;
    });
  }, [app.settings.app_bindings.switch]);



  /* Navigation with Keypress */
  const cycleView = () => {
    const viewKeys = Object.keys(viewMap);
    let currentIndex = viewKeys.indexOf(app.system.view);

    if (currentIndex === viewKeys.length - 1) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }

    app.update((state) => {
      state.system.view = viewKeys[currentIndex];
    });
  };

  useEffect(() => {
    if (key.keyStroke === app.system.switch) cycleView();
  }, [key.keyStroke]);



  return (
    <>
      {app.system.startedUp ? (
        <>
          <TopBar app={app} />
          <NavBar isHovering={isHovering} />
          <MainContainer app={app} height={windowSize.height} width={windowSize.width} onClick={handleClick}>
            <SideBar collapseLength={collapseLength} />
            <Card
              stream={app.system.carplay.connected}
              theme={theme}
              currentView={app.system.view}
              carplayVisible={app.system.interface.carplay}
              maxHeight={windowSize.height - app.settings.side_bars.topBarHeight.value - cardPadding}
              minHeight={0}
              collapseLength={(collapseLength / 1000)}
            >
              <Page theme={theme}>

                <Fade className={fadePage} fadeLength={(fadeLength / 1000)}>
                  {renderView()}
                </Fade>
                <NavBlocker
                  app={app}
                  theme={theme}
                  isActive={app.system.interface.navBar}
                  collapseLength={collapseLength / 1000}
                  minHeight={0}
                  maxHeight={app.settings.side_bars.navBarHeight.value - app.settings.general.contentPadding.value}
                />
              </Page>

            </Card>
          </MainContainer>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default Content;
