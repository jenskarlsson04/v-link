import { useState, useEffect, useRef } from 'react'
import styled, { useTheme } from 'styled-components';

import { APP } from '../../../../store/Store';

import RadialGauge from '../../../components/RadialGauge'
import DataBox from '../../../components/DataBox'


const Container = styled.div`
  display: flex; 
  flex-direction:column;
  width: 100%;
  height: 100%;
`;

const Gauges = styled.div`
  display: flex; 
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;


  width: 100%;
  height: 70%;

  background-image: url(/assets/svg/background/horizon.svg#horizon);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
`;


const Classic = () => {
	const app = APP((state) => state);

	const theme = useTheme()
	const Databox = DataBox(app.settings.dash_race) // Amount of Items, 2 Columns


	/* Observe container resizing and update dimensions. */
	const containerRef = useRef(null);
	    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });


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

	return (
		<Container>
			<Gauges ref={containerRef}>
				<div style={{ height: '65%' }}>
					<RadialGauge
						sensor={app.settings.dash_classic.gauge_2.value}
						type={app.settings.dash_classic.gauge_2.type}
						bars={false}
					/>
				</div>
				<RadialGauge
					sensor={app.settings.dash_classic.gauge_1.value}
					type={app.settings.dash_classic.gauge_1.type}
					
				/>
				<RadialGauge
					sensor={app.settings.dash_classic.gauge_2.value}
					type={app.settings.dash_classic.gauge_2.type}
				/>
				<div style={{ height: '65%' }}>
					<RadialGauge
						sensor={app.settings.dash_classic.gauge_2.value}
						type={app.settings.dash_classic.gauge_2.type}
						bars={false}
					/>
				</div>
			</Gauges>
			<div
				style={{
					width: '100%',
					height: '35%',

					backgroundImage: 'url(/assets/svg/background/glow.svg#glow)', /* Corrected */
					backgroundSize: 'contain',
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'center',
				}}>
				{Databox}
			</div>

		</Container>
	)
};


export default Classic;