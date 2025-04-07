import {
  useEffect,
  useMemo,
} from 'react'
import { CANWorker, ADCWorker } from './worker/types'
import { DATA } from './../store/Store';
import { APP } from './../store/Store';

import Display from './helper/Display';
import Ignition from './helper/Ignition';
import Recorder from './helper/Recorder';

import { io } from "socket.io-client";
const sysChannel = io("ws://localhost:4001/sys")




function Cardata() {

  const app = APP((state) => state)
  const updateApp = APP((state) => state.update)

  const data = DATA((state) => state)
  const updateData = DATA((state) => state.update);

  const canWorker = useMemo(() => {
    const worker = new Worker(
      new URL('./worker/CAN.worker.ts', import.meta.url), {
      type: 'module'
    }
    ) as CANWorker
    return worker
  }, [])

  const adcWorker = useMemo(() => {
    const worker = new Worker(
      new URL('./worker/ADC.worker.ts', import.meta.url), {
      type: 'module'
    }
    ) as ADCWorker
    return worker
  }, [])

  useEffect(() => {
    canWorker.onmessage = (event) => {
      const { type, message } = event.data;
      const newData = { [type]: message };
      updateData(newData.message)
    };

    adcWorker.onmessage = (event) => {
      const { type, message } = event.data;
      const newData = { [type]: message };
      updateData(newData.message)
    };

    return () => {
      // Clean up the worker when the component is unmounted
      adcWorker.terminate();
      canWorker.terminate();
    };
  }, []);

  return (
    <>
      <Display 
        autoOpen={app.settings.screen.autoOpen.value}
        io={sysChannel}
      />
      <Ignition
        ignition={app.system.ignition}
        autoShutdown={app.settings.shutdown.autoShutdown.value}
        shutdownDelay={app.settings.shutdown.shutdownDelay.value}
        messageTimeout={app.settings.shutdown.messageTimeout.value}
        updateApp={updateApp}
        io={sysChannel}
      />
      <Recorder 
        data={data.data}
        resolution={app.settings.dash_charts.resolution.value}
        setCount={app.settings.constants.chart_input_current}
        recording={app.system.recording}
        settings={app.settings}
        modules={app.modules}
        />
    </>
  );
}

export default Cardata
