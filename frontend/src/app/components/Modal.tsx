import React from 'react';
import ReactDOM from 'react-dom';
import styled, { useTheme } from 'styled-components';
import { Typography } from '../../theme/styles/Typography';
import { Button } from '../../theme/styles/Inputs';




const Content = styled.div`
  position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    textSize: 3rem;
    color:'#DBDBDB';
    gap: 10px;
`

const Exit = styled.button`
  position: absolute;
  top: 50px;
  right: 30px;
  border: none;
  background: none;
  font-size: 25px;
  cursor: pointer;
  color: #DBDBDB;
`

const Modal = ({ isOpen, onClose, title, body, button, action }) => {
  const Body1 = Typography.Body1
  const Title = Typography.Title

  if (!isOpen) return null; // Don't render the modal if it's not open

  return ReactDOM.createPortal(
    <Content>
      <Title> {title} </Title>
      <Body1>{body} </Body1>
      {action ?
        <Button style={{width: '300px', background: '#151515'}} onClick={action}>
          {button}
        </Button> : <></>}
      <Exit onClick={onClose}>
        X
      </Exit>
    </Content>,
    document.getElementById('root') // The modal renders in this DOM element
  );
};


export default Modal;
