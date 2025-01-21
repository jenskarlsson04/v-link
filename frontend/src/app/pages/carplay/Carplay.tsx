import { useState, useEffect, useRef } from 'react';
import styled, { css, useTheme } from 'styled-components';

import { ToggleSwitch, Select, Input, Button, Link } from '../../../theme/styles/Inputs';
import { IconSmall, IconMedium, CustomIcon } from '../../../theme/styles/Icons';
import { Fade, GlowLarge } from '../../../theme/styles/Effects';
import { NavBlocker, FlexBox } from '../../../theme/styles/Container'
import { Typography } from '../../../theme/styles/Typography';

import { APP, KEY } from '../../../store/Store';

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;


function Carplay() {
    const app = APP((state) => state);
    const theme = useTheme()

    const Body2 = Typography.Body2

    const [isActive, setIsActive] = useState(false)
    const [isReady, setIsReady] = useState(false)

    const onClick = () => {
        console.log(isActive)
        app.update((state) => {
            state.system.carplay.user = true; // Mutate state using Immer
          });
        setIsActive(!isActive)
    };


    useEffect(() => {
        if(app.system.carplay.phone) {
            setIsReady(true)
        } else {
            setIsReady(false)
        }

    }, [app.system.carplay.phone, isActive])




    return (
        <Container>
                <Body2>CONNECT iPHONE / ANDROID DEVICE</Body2>
                <Link onClick={() => onClick()} isActive={isActive} style={{width: '150px', alignItems: 'center', justifyContent:'center'}}>
                        <CustomIcon
                            size={theme.icons.xlarge}
                            isActive={isActive}
                            theme={theme}
                            stroke={4}
                            fill={isActive ? (isReady ? theme.colors.theme.blue.active : theme.colors.theme.blue.default) : theme.colors.medium}
                            color={isActive ? (isReady ? theme.colors.theme.blue.active : theme.colors.theme.blue.default) : theme.colors.medium}>
                            <use xlinkHref={`/assets/svg/buttons/link.svg#link`}></use>
                        </CustomIcon>
                </Link>
        </Container>
    );
}

export default Carplay;
