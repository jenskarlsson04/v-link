import React from 'react';
import ReactDOM from 'react-dom';
import styled, { useTheme } from 'styled-components';


const Content = styled.div`
  position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    textSize: 3rem;
    color:'#DBDBDB'
`

const Bla = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  text-align: center;
  positon: relative;
`

const Button = styled.button`
  position: absolute;
  top: 50px;
  right: 30px;
  border: none;
  background: none;
  font-size: 25px;
  cursor: pointer;
  color: #DBDBDB;
`

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  return ReactDOM.createPortal(
    <Content>
      {children}
      <Button onClick={onClose}>
        X
      </Button>
    </Content>,
    document.getElementById('root') // The modal renders in this DOM element
  );
};


export default Modal;
