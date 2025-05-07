export interface PopupControls {
	authPopupOpen: boolean;
	accountPopUpOpen: boolean;
	cartPopupOpen: boolean;
	toggleAuthPopup: () => void;
	closeAuthPopup: () => void;
	toggleAccountPopUp: () => void;
	closeAccountPopUp: () => void;
	toggleCartPopUp: () => void;
	closeCartPopUp: () => void;
}
