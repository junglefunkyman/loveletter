import * as React from 'react';
import {useState} from 'react';
import {cardDescriptionMapping, cardNameMapping, CardType, needPlayerSelected} from '../model/commonTypes';
import {Button, Form, Modal} from 'react-bootstrap';
import {Card} from './Card';
import {Player} from '../model/Player';

interface ActionDialogProps {
  card: CardType | undefined;
  player: Player | undefined;
  hasAvailablePlayers: boolean;
  show: boolean;
  onHide: () => void;
  onSubmit: (guess?: CardType) => void;
}

export const ActionDialog = (props: ActionDialogProps) => {
  const guard = props.card === CardType.Guard;
  const [guess, setGuess] = useState<CardType>(undefined);
  const disabled = guard && !guess;
  const submit = () => !disabled && props.onSubmit(guess);
  const buttonType = disabled ? 'light' : 'primary'
  return (
    <Modal show={props.show} onHide={props.onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Your move</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <MoveDescription card={props.card} player={props.player} hasAvailablePlayers={props.hasAvailablePlayers}/>
        {guard && (<GuardGuess guess={guess} setGuess={setGuess}/>)}
      </Modal.Body>

      <Modal.Footer>
        <Button variant={buttonType} onClick={submit} disabled={disabled}>Apply</Button>
        <Button variant="link" onClick={props.onHide}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}

interface MoveDescriptionProps {
  card: CardType | undefined;
  player: Player | undefined;
  hasAvailablePlayers: boolean;
}

const MoveDescription = (props: MoveDescriptionProps) => {
  const description = renderDescription(props);
  if (!needPlayerSelected(props.card) || !props.hasAvailablePlayers) return (
    <>
      <div className="move-description">
        <Card card={props.card} showDescription={false}/>
      </div>
      {description}
    </>
  );
  return (
    <>
      <div className="move-description">
        Play <Card card={props.card} showDescription={false}/> on {props.player?.name}
      </div>
      {description}
    </>
  );
}

function renderDescription(props: MoveDescriptionProps) {
  return (
    <div className="card-description">
      {cardDescriptionMapping[props.card]}
    </div>
  );
}

interface GuardChoiceProps {
  guess: CardType | undefined;
  setGuess: (choice: CardType) => void;
}

const GuardGuess = (props: GuardChoiceProps) => {
  return (
    <fieldset>
      <Form.Group>
        <Form.Label as="legend">Guess card</Form.Label>
        {GUARD_CHOICES.map((card: CardType) => (
          <Form.Check
            checked={card === props.guess}
            type='radio'
            key={`check-${card}`}
            name='guardChoice'
            value={card}
            label={cardNameMapping[card]}
            onChange={(e: any) => {
              const guess = parseInt(e.target.value, 10);
              props.setGuess(guess);
            }}
          />
        ))}
      </Form.Group>
    </fieldset>
  );
}

const GUARD_CHOICES = [CardType.Priest, CardType.Baron, CardType.Handmaid, CardType.Prince, CardType.King, CardType.Countess, CardType.Princess];