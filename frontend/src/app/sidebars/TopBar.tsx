import { useState, useEffect } from "react";
import { APP, DATA } from '../../store/Store';
import styled, { css, useTheme } from 'styled-components';

import { IconSmall, CustomIcon } from '../../theme/styles/Icons';
import { Caption1 } from '../../theme/styles/Typography';

const Topbar = styled.div`
  position: absolute;
  top: 0;
  z-index: 3;

  background: ${({ theme }) => theme.colors.gradients.gradient1};

  height: ${({ app }) => `${app.settings.side_bars.topBarHeight.value}px`};
  animation: ${({ app, theme, isActive }) => css`
    ${isActive
      ? theme.animations.getSlideUp(-app.settings.side_bars.topBarHeight.value)
      : theme.animations.getSlideDown(-app.settings.side_bars.topBarHeight.value)} 0.3s ease-in-out forwards
  `};
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  padding: 5px 20px;
  gap: 10px;

  overflow: hidden;
`;

const Left = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const Middle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const Right = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: right;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 10px;
`;

const Scroller = styled.div`
  position: relative;
  display: flex; 
  flex-direction: column;


  width: 100%;
  height: 30px;

  overflow: hidden;
`;

const ScrollerContent = styled.div`
  position: absolute;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  width: 100%;
  height: 30px; /* Each child has a fixed height of 30px */
  gap: 10px;

  top: ${({ active }) => (active ? "0" : "30px")};
  transition: top 0.3s ease-in-out;


`;

const TopBar = () => {
  const app = APP((state) => state);
  const data = DATA((state) => state.data);
  const modules = APP((state) => state.modules);


  const settings = APP((state) => state.settings.dash_topbar);
  const theme = useTheme();
  const themeColor = (app.settings.general.colorTheme.value).toLowerCase()


  const valueName = settings.value.value
  const valueType = settings.value.type
  const valueID = modules[valueType]((state) => state.settings.sensors[valueName].app_id)
  const valueData = data[valueName]
  const valueLimit = modules[valueType]((state) => state.settings.sensors[valueName].limit_start)

  const [time, setDate] = useState(new Date());

  function updateTime() {
    setDate(new Date());
  }

  useEffect(() => {
    const timer1 = setInterval(updateTime, 10000);
    return () => clearInterval(timer1);
  }, []);

  return (
    <Topbar isActive={
      app.settings.side_bars.dashBar.value
  &&  app.system.view === 'Carplay'
  && !app.system.interface.content
  && !app.system.interface.navBar}
      theme={theme}
      app={app}>
      <Left>
        <Scroller>
          <ScrollerContent active={app.system.interface.content}>
            <Caption1>{time.toLocaleTimeString('sv-SV', { hour: '2-digit', minute: '2-digit' })}</Caption1>
          </ScrollerContent>
          <ScrollerContent active={!app.system.interface.content}>
            <CustomIcon
                stroke={3}
                size={'14px'}
                isActive={valueData > valueLimit}
                activeColor={theme.colors.theme[themeColor].highlightDark}
                defaultColor={theme.colors.light}
                inactiveColor={theme.colors.medium}
                glowColor={theme.colors.theme[themeColor].default}>
                <use xlinkHref={`/assets/svg/icons/data/${valueID}.svg#${valueID}`}></use>
            </CustomIcon>
            <Caption1>{valueData}</Caption1>
          </ScrollerContent>
        </Scroller>
      </Left>
      <Middle>
        <svg viewBox="0 0 350.8 48.95" xmlns="http://www.w3.org/2000/svg">
          <use xlinkHref="/assets/svg/logos/typo.svg#volvo"></use>
        </svg>
      </Middle>
      <Right>
        {/*
        <IconSmall isActive={false}>
          <use xlinkHref="/assets/svg/bluetooth.svg#bluetooth" />
        </IconSmall>
        */}
        <IconSmall isActive={app.system.carplay.phone}>
          <use xlinkHref="/assets/svg/icons/interface/phone.svg#phone" />
        </IconSmall>
        <IconSmall isActive={app.system.wifiState}>
          <use xlinkHref="/assets/svg/icons/interface/wifi.svg#wifi" />
        </IconSmall>
      </Right>
    </Topbar>
  );
};

export default TopBar;
