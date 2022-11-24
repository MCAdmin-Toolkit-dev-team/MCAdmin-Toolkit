import React, { useEffect, useRef, useState } from 'react';
import {
  Page,
  Navbar,
  NavTitle,
  NavTitleLarge,
  Link,
  Toolbar,
  Block,
  Button,
  f7,
  Popup,
  Searchbar,
  Icon,
  Input,
  List,
  ListItem,
  Preloader
} from 'framework7-react';

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
}

function ServerBlock (props) {

  var sessionKey = "";
  var fetched = false;

  const blocker = null;

  const [text, setText] = useState (props.text);
  const [imgHolderContent, setImgContentHolder] = useState (1);
  const [img, setImg] = useState ('/static/DefaultServerIcon.png');
  const rootElem = useRef (null);

  const imgHolderRealContent = <img src={img} />;

  const loader = async () => {
    try {
      var response = await fetchWithTimeout ("https://" + props.address + "/LOGIN", {method: 'POST', body: props.authkey});
      if (response.status >= 400 && response.status < 600) {
        throw '';
      }
    } catch {
      setText ("error");
      setImgContentHolder (3);
      rootElem.current.addEventListener ('click', () => {
        f7.dialog.alert ("Server is offline or auth key is wrong", "Error");
      });
      return;
    }

    var body = await response.json ();

    rootElem.current.addEventListener ('click', () => {
      f7.view.main.router.navigate ({name: 'server', params: {serverName: props.title, serverType: body.serverType, serverAddress: props.address}});
      console.log ("działa");
    });

    if (body.icon != "none") {
      console.log (body.icon);
      setImg ("data:image/png;base64," + body.icon);
    }

    setImgContentHolder (2);

    setText (<span>Server type: {body.serverType}<br />Players: {body.players}</span>);
    sessionKey = body.sessionKey;
    fetched = true;
  }

  useEffect (() => {loader ()}, [blocker]);

  return (
      <div className="serverBlock" ref={rootElem}>
          <div className="image">
              <Preloader style={{display: imgHolderContent == 1 ? 'block' : 'none'}} size={42} />
              <img style={{display: imgHolderContent == 2 ? 'block' : 'none', minWidth: '100%'}} src={img} />
          </div>
          <div className="paragraph">
              <h3>{props.title}</h3>
              {text}
          </div>
      </div>
  );
}

const HomePage = () => {

  const [loginPopupOpened, setLoginPopupOpened] = useState (false);

  const localStorage = window.localStorage;
  var value = localStorage.getItem ('servers');

  const [items, setItems] = useState ([]);

  const blocker = null;

  const handleDownloadBtn = () => {
    f7.dialog.prompt ("Enter download code", async (code) => {
      f7.dialog.preloader ("Downloading authkey...");

      let address = document.querySelector ('#address').value;
      let port = document.querySelector ('#port').value;

      let result;

      try {
        result = await fetchWithTimeout ('https://' + address + ':' + port + '/GETAUTHKEY', {method: 'POST', body: code});

        if (!result.ok) {
          throw '';
        }
      } catch {
        f7.dialog.close ();
        f7.dialog.alert ("Could not download authkey, please make sure you have entered correct address, port and download code", "Error...");
      }

      let authkey = await result.text ();

      document.querySelector ('#authkey').value = authkey;

      f7.dialog.close ();
    });
  }

  useEffect (() => {
    if (value != null) {
      let savedItems = JSON.parse (value);
      let toDisplayItems = [];
      savedItems.forEach(savedItem => {
        toDisplayItems.push (<ListItem><ServerBlock image="/static/walterWhite.jpg" title={savedItem.title} text="Fetching" address={savedItem.address} authkey={savedItem.authkey} /></ListItem>)
      });
  
      setItems ([...toDisplayItems]);
    }
  }, [blocker]);

  return (<Page name="home">
    {/* Top Navbar */}
    {/*<Navbar large>
      <NavTitle>MCAdmin-Toolkit</NavTitle>
      <NavTitleLarge>MCAdmin-Toolkit</NavTitleLarge>
</Navbar>*/}
    {/* Toolbar */}
    {/*<Toolbar bottom>
      <Link>Left Link</Link>
      <Link>Right Link</Link>
</Toolbar>*/}
    {/* Page content */}
    <div className='searchBar'>
    <Searchbar searchContainer=".servers" searchIn='h3' backdrop={true} className='searchBar' disableButton={false}>
      <Button style={{marginLeft: 10}} className='addBtn' onClick={() => {setLoginPopupOpened(true)}}><Icon f7="plus"></Icon></Button>
    </Searchbar>
    </div>

    <List className='servers'>
      {items}
    </List>

    <img src='/static/BackgroundThing.png' style={{width: "100%", position: "absolute", bottom: 0}} />

    <Popup className='loginPopup' opened={loginPopupOpened} onPopupClosed={() => {setLoginPopupOpened (false)}}>
      <Page>
        <div className='loginField'>
          <Input outline type='text' placeholder='Server Name' inputId="serverName" />
          <Input outline type='text' placeholder='Server Address' inputId="address" />
          <Input outline type='number' placeholder='MCAdmin-Toolkit-Connector Port' inputId="port" />
          <div className='authKeySection'>
            <Input outline type='text' placeholder='AuthKey' inputId="authkey" />
            <Button className='downloadAuthKeyBtn' onClick={handleDownloadBtn}><Icon f7='arrow_down_to_line' /></Button>
          </div>
          <div className='buttons'>
            <Button className='backBtn' onClick={() => {setLoginPopupOpened (false)}}><Icon f7='chevron_left' /><span>Back</span></Button>
            <Button className='loginBtn' onClick={() => {
              let serverNameEl = document.querySelector ('#serverName');
              let addressEl = document.querySelector ('#address');
              let portEl = document.querySelector ('#port');
              let authkeyEl = document.querySelector ('#authkey');

              if (serverNameEl.value == "" || addressEl.value == "" || portEl.value == "" || authkeyEl.value == "") {
                f7.toast.show ({text: "Please fill all inputs"});
                return;
              }

              let val = localStorage.getItem ("servers");

              let arr = [];

              if (val != null) {
                arr = JSON.parse (val);
              }
              let itemsToDisplay = items;
              itemsToDisplay.push (<ListItem><ServerBlock image="/static/walterWhite.jpg" title={serverNameEl.value} text="Fetching" address={addressEl.value + ":" + portEl.value} authkey={authkeyEl.value} /></ListItem>);
              arr.push ({title: serverNameEl.value, address: addressEl.value + ":" + portEl.value, authkey: authkeyEl.value});
              localStorage.setItem ("servers", JSON.stringify (arr));
              setItems ([...itemsToDisplay]);
              setLoginPopupOpened (false);
            }}><span>Add Server</span><Icon f7='checkmark_alt' /></Button>
          </div>
        </div>
      </Page>
    </Popup>
  </Page>)
};
export default HomePage;