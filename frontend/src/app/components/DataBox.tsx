import { useState, useEffect, useRef } from 'react';
import styled, { useTheme } from 'styled-components';

import { DATA, APP } from '../../store/Store';
import { Typography } from '../../theme/styles/Typography';
import { CustomIcon } from '../../theme/styles/Icons';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  box-sizing: border-box;
  padding-top: 30px;

  background-image: url('/assets/svg/background/road.svg#road');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const Databox = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;
const Icons = styled.div`
  flex 1;

  display: flex;
  gap: 200px;

  justify-content: center;
  align-items: center;
  width: 100%;
  height: 20px;

  padding-left: 20px;
  padding-right: 20px;
  box-sizing: border-box;
  `;

const Svg = styled.svg`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const DataBox = () => {
    const theme = useTheme();

    const app = APP((state) => state)
    const data = DATA((state) => state.data);
    const modules = APP((state) => state.modules);
    const settings = APP((state) => state.settings.dash_classic);

    const themeColor = (app.settings.general.colorTheme.value).toLowerCase()

    const padding = 20; // Padding for the rect size
    const containerRef = useRef(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const { width, height } = dimensions;

    /* Observe container resizing and update dimensions. */
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const leftName = settings.value_1.value
    const leftType = settings.value_1.type
    const leftID = modules[leftType]((state) => state.settings.sensors[leftName].app_id)
    const leftData = data[leftName]
    const leftLimit = modules[leftType]((state) => state.settings.sensors[leftName].limit_start)

    const rightName = settings.value_2.value
    const rightType = settings.value_2.type
    const rightID = modules[rightType]((state) => state.settings.sensors[rightName].app_id)
    const rightData = data[rightName]
    const rightLimit = modules[rightType]((state) => state.settings.sensors[rightName].limit_start)


    const [customMsg, setCustomMsg] = useState('No Messages')
    const [toggle, setToggle] = useState(false)

    const centerName = settings.message_data.value
    const centerType = settings.message_data.type
    const centerID = modules[centerType]((state) => state.settings.sensors[centerName].app_id)
    const centerMsg = settings.message_text.value
    const centerLimit = settings.message_threshold.value
    const centerData = data[centerName]
    const centerOperator = settings.message_option.value

    /* Update center values. */
    useEffect(() => {
        const defaultText = 'No Messages'

        if (centerOperator === '>') {
            if (centerData > centerLimit) {
                setCustomMsg(centerMsg)
                setToggle(true)
            }
            else {
                setCustomMsg(defaultText)
                setToggle(false)
            }
        } else if (centerOperator === '<') {
            if (centerData < centerLimit) {
                setCustomMsg(centerMsg)
                setToggle(true)
            }
            else {
                setCustomMsg(defaultText)
                setToggle(false)
            }
        } else if (centerOperator === '=') {
            if (centerData === centerLimit) {
                setCustomMsg(centerMsg)
                setToggle(true)
            }
            else {
                setCustomMsg(defaultText)
                setToggle(false)
            }
        }
    }, [centerData]);



    // Return the layout
    return (
        <Container>
            <Icons>
                <CustomIcon
                    stroke={2}
                    size={'25px'}
                    isActive={leftData > leftLimit}
                    activeColor={theme.colors.theme[themeColor].highlightDark}
                    defaultColor={theme.colors.light}
                    inactiveColor={theme.colors.medium}
                    glowColor={theme.colors.theme[themeColor].default}>
                    <use xlinkHref={`/assets/svg/icons/data/${leftID}.svg#${leftID}`}></use>
                </CustomIcon>
                <CustomIcon color={toggle ? theme.colors.theme.blue.highlightDark : theme.colors.medium} stroke={2} size={'40px'}>
                    <use xlinkHref={`/assets/svg/icons/data/${'err_bold'}.svg#${'err'}`}></use>
                </CustomIcon>
                <CustomIcon
                    stroke={2}
                    size={'25px'}
                    isActive={rightData > rightLimit}
                    activeColor={theme.colors.theme[themeColor].highlightDark}
                    defaultColor={theme.colors.light}
                    inactiveColor={theme.colors.medium}
                    glowColor={theme.colors.theme[themeColor].default}>
                    <use xlinkHref={`/assets/svg/icons/data/${rightID}.svg#${rightID}`}></use>
                </CustomIcon>
            </Icons>
            <Databox ref={containerRef}>
                {width > 0 && height > 0 && (
                    <Svg viewBox={`0 0 ${width} ${height}`}>
                        <defs>
                            <linearGradient id="fadeDatabox" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={theme.colors.medium} />
                                <stop offset="80%" stopColor="rgba(255, 255, 255, 0)" />
                            </linearGradient>
                        </defs>
                        <rect
                            x={padding} // Center the box by applying half the padding as an offset
                            y={padding}
                            width={width - (padding * 2)} // Subtract padding from width
                            height={height - (padding * 2)} // Subtract padding from height
                            rx="12" // Rounded corners
                            ry="12"
                            fill="rgba(0, 0, 0, 0.2)"
                            stroke="url(#fadeDatabox)"
                            strokeWidth="1"
                        />

                        {/* Calculate the total width and gap */}
                        <text
                            x={width / 2 - 1.5 * 155} // Shift the first text left for the total group to be centered
                            y={height / 2} // Center text vertically
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fontSize={theme.typography.display1.fontSize}
                            fontFamily={theme.typography.display1.fontFamily}
                            fontWeight={theme.typography.caption2.fontWeight}
                            fill={theme.colors.light}
                        >
                            {data[leftName]}
                        </text>

                        <text
                            x={width / 2} // Center the second text horizontally
                            y={height / 2} // Center text vertically
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fontSize={theme.typography.display1.fontSize}
                            fontFamily={theme.typography.display1.fontFamily}
                            fontWeight={theme.typography.caption2.fontWeight}
                            fill={toggle ? theme.colors.theme.blue.highlightDark : theme.colors.medium}

                        >
                            {customMsg}
                        </text>

                        <text
                            x={width / 2 + 1.5 * 155} // Shift the third text right for the total group to be centered
                            y={height / 2} // Center text vertically
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fontSize={theme.typography.display1.fontSize}
                            fontFamily={theme.typography.display1.fontFamily}
                            fontWeight={theme.typography.caption2.fontWeight}
                            fill={theme.colors.light}
                        >
                            {data[rightName]}
                        </text>

                    </Svg>
                )}
            </Databox>

        </Container>
    );
};

export default DataBox;
