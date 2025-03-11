import {
  useEffect,
  useMemo,
  useRef
} from 'react'
import { CANWorker, ADCWorker } from './worker/types'
import { DATA } from './../store/Store';
import { APP } from './../store/Store';

import { io } from "socket.io-client";
const sysChannel = io("ws://localhost:4001/sys")




function Cardata() {


  const app = APP((state) => state)
  const data = DATA((state) => state)
  const update = DATA((state) => state.update);

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
      update(newData.message)
    };

    adcWorker.onmessage = (event) => {
      const { type, message } = event.data;
      const newData = { [type]: message };
      update(newData.message)
    };

    return () => {
      // Clean up the worker when the component is unmounted
      adcWorker.terminate();
      canWorker.terminate();
    };
  }, []);



  const extendedTimer = useRef<NodeJS.Timeout | null>(null);
  const shutdownTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startShutdownTimer = () => {
      shutdownTimer.current = setTimeout(() => {
        //sysChannel.emit("systemTask", "shutdown");
      }, 10000);
    };

    if (!app.system.ignition) {
      // Start initial 10-second shutdown timer
      startShutdownTimer();

      app.update((state) => {
        state.system.modal.visible = true;
        state.system.modal.title = "Ignition Off.";
        state.system.modal.body =
          "System will shut down in 10 seconds to prevent battery drain. \n Click to dismiss for 5 minutes.";
        state.system.modal.button = "DISMISS";
        state.system.modal.action = () => {
          if (shutdownTimer.current) clearTimeout(shutdownTimer.current); // Cancel shutdown timer

          // Start 10-minute extended timer
          extendedTimer.current = setTimeout(() => {
            app.update((state) => {
              state.system.modal.visible = true;
            });
            startShutdownTimer(); // Restart 10-second timer when modal appears again
          }, 5 * 60 * 1000); // 5 minutes

          // Hide modal after clicking dismiss
          app.update((state) => {
            state.system.modal.visible = false;
          });
        };
      });
    } else {
      // If ignition is turned back on, clear all timers
      if (shutdownTimer.current) clearTimeout(shutdownTimer.current);
      if (extendedTimer.current) clearTimeout(extendedTimer.current);

      app.update((state) => {
        state.system.modal.visible = false;
      });
    }

    return () => {
      if (shutdownTimer.current) clearTimeout(shutdownTimer.current);
      if (extendedTimer.current) clearTimeout(extendedTimer.current);
    };
  }, [app.system.ignition]);


  return null
}

export default Cardata
