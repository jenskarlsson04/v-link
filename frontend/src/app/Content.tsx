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

  display: ${({ app }) => (app.system.view === 'Carplay' ? 'flex' : 'flex')};
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-start;

  box-sizing: border-box;
  padding-top: ${({ app }) => `${app.settings.side_bars.topBarHeight.value}px`};
  padding-left: ${({ app }) => `${app.settings.general.contentPadding.value}px`};
  padding-right: ${({ app }) => `${app.settings.general.contentPadding.value}px`};
  padding-bottom: ${({ app }) => `${app.settings.general.contentPadding.value}px`};
  background: none;
  //background: '${({ theme }) => `${theme.colors.gradients.gradient1}`}';
`;



const Card = styled.div`
  flex: 1;

  display: flex;
  flex-direction: column;
  //align-items: stretch;
  justify-content: center;

  overflow: hidden;

  /* Apply the animation based on the current view */
  animation: ${({ theme, currentView, carPlay, minHeight, maxHeight, collapseLength }) => {

    if (currentView === 'Carplay' && carPlay) {
      return css`
        ${theme.animations.getVerticalCollapse(minHeight, maxHeight)} ${collapseLength}s ease-in-out forwards,
        fadeOut ${collapseLength}s ease-in-out forwards;
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

  /* Add keyframes for fade effects */
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
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

  animation: ${({ app, theme, isActive, collapseLength, minHeight, maxHeight }) => css`
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



  /* Testcode */

  useEffect(() => {
    //console.log('value change')

    //console.log(app.system.carplay)


    if (app.system.carplay.user && app.system.carplay.stream){
      //console.log('carplay enabled?', (true))
      setCarPlay(true)}
    else
      setCarPlay(false)
  }, [app.system.carplay])



  /* Get windowSize size */
  const windowSize = { width: window.innerWidth, height: window.innerHeight };



  /* Carplay Logic */
  const fadeLength = 200; //ms
  const collapseLength = 400; //ms
  const [fadeMain, setFadeMain] = useState('fade-in');
  const [fadePage, setFadePage] = useState('fade-in');
  const [currentView, setCurrentView] = useState(app.system.view);
  const [carPlay, setCarPlay] = useState(false);

  useEffect(() => {
    if (app.system.view !== currentView) {
      setFadePage('fade-out'); // Trigger fade-out for the current view
      
      setTimeout(() => {
        setCurrentView(app.system.view); // Switch to the new view
        if (carPlay && app.system.view === 'Carplay') {
          setNavActive(false);
          app.update((state) => {
            state.system.interface.content = true; // Mutate state using Immer
          });
          return;
        } else {
          setFadePage('fade-in');
          app.update((state) => {
            state.system.interface.content = true; // Mutate state using Immer
          });
        }
      }, fadeLength); // Duration should match the CSS animation time
    }
  }, [app.system.view, carPlay]);

  useEffect(() => {
    if (carPlay && app.system.view === 'Carplay') {
      setNavActive(false);
      setFadePage('fade-out');
      app.update((state) => {
        state.system.interface.content = false; // Mutate state using Immer
      });
    }
  }, [app.system.view, carPlay])



  /* NavBar Logic */
  const timerRef = useRef(null); // Store the timer ID
  const [navActive, setNavActive] = useState(true)
  const [isHovering, setIsHovering] = useState(false);

  const checkMouseY = (mouseY) => {
    const deadZone = 85; // Percentage
    if (mouseY > window.innerHeight * (deadZone / 100))
      return true;
    else
      return false;
  }

  useEffect(() => {
    if (app.system.view === 'Settings') {
      setNavActive(true);
      clearTimeout(timerRef.current); // Clear the timeout immediately if in Settings
      return;
    }

    if (navActive) {
      timerRef.current = setTimeout(() => setNavActive(false), 4000);
    }

    return () => clearTimeout(timerRef.current);
  }, [app.system.view, navActive]);

  const handleClick = (event) => {
    if (app.system.view != 'Settings')
      setNavActive(checkMouseY(event.clientY));
  };

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
      state.system.switch = app.settings.app_bindings.switch.value; // Mutate state using Immer
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
      state.system.view = viewKeys[currentIndex]; // Mutate state using Immer
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
          <NavBar isActive={navActive} isHovering={isHovering} />
          <MainContainer app={app} height={windowSize.height} width={windowSize.width} onClick={handleClick}>
            <SideBar collapseLength={collapseLength} />
            <Card
              theme={theme}
              currentView={currentView}
              carPlay={carPlay}
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
                  isActive={navActive}
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
