import * as React from 'react';
import {useEffect} from 'react';
import {iddqd, loadUrl, MaybeJoinedUser} from '../reducers/connection';
import {CreateGame, JoinGame} from '../components/StartPage';
import ManagedStatusPanel from '../containers/ManagedStatusPanel';
import PlayerHandContainer from '../containers/PlayerHandContainer';
import ManagedFeedback from '../containers/ManagedFeedback';
import ManagedBoard from '../containers/ManagedBoard';
import {AppState} from '../components/App';
import {connect} from 'react-redux';
import {PLAYERS_NUMBER} from '../model/commonTypes';
import {store} from '../store';
import {GameNotFound, GamePreexisted} from '../components/GameErrors';

const PageController = (props: PageControllerProps) => {
  const readyUsers = props.users?.filter(u => u.ready)?.length || 0;

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
  }, []);

  if (props.gameNotFound) {
    return (<GameNotFound/>);
  } else if (props.gamePreexisted) {
    return (<GamePreexisted/>);
  } else if (!props.gameId) {
    return (<CreateGame/>);
  } else if (!props.name || readyUsers < PLAYERS_NUMBER || !props.joined) {
    return (<JoinGame/>);
  }
  return (
    <>
      <ManagedStatusPanel/>
      <ManagedBoard/>
      <PlayerHandContainer/>
      <ManagedFeedback/>
    </>
  );
}

let keys = '';

function handleKeyDown(e: KeyboardEvent) {
  keys = keys + e.key.toLowerCase();
  if (keys.indexOf('iddqd') !== -1) {
    // @ts-ignore
    store.dispatch(iddqd());
    keys = '';
  }
}

interface PageControllerProps {
  gameId?: string;
  name?: string;
  joined: boolean;
  users: MaybeJoinedUser[];
  gameNotFound: boolean;
  gamePreexisted: boolean;
  loadUrl: () => void;
}

const mapStateToProps = (state: AppState) => state.connection

export default connect(mapStateToProps, {loadUrl})(PageController);