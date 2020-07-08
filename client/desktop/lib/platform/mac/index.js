/**
 * External Dependencies
 */
const { app, Menu } = require( 'electron' ); // eslint-disable-line import/no-extraneous-dependencies

/**
 * Internal dependencies
 */
const appQuit = require( 'desktop/lib/app-quit' );
const menuSetter = require( 'desktop/lib/menu-setter' );
const log = require( 'desktop/lib/logger' )( 'platform:mac' );

function MacPlatform( mainWindow ) {
	this.window = mainWindow;
	this.dockMenu = Menu.buildFromTemplate( require( './dock-menu' )( app, mainWindow ) );

	app.dock.setMenu( this.dockMenu );

	app.on( 'activate', function () {
		log.info( 'Window activated' );

		mainWindow.show();
		mainWindow.focus();
	} );

	app.on( 'window-all-closed', function () {
		log.info( 'All windows closed, shutting down' );
		app.quit();
	} );

	app.on( 'before-quit', function () {
		log.info( 'Application quit triggered' );

		appQuit.allowQuit();
	} );

	mainWindow.on( 'close', function ( ev ) {
		if ( appQuit.shouldQuitToBackground() ) {
			log.info( 'Window close puts app into background' );
			ev.preventDefault();
			mainWindow.hide();
		}
	} );
}

MacPlatform.prototype.restore = function () {
	if ( this.window.isMinimized() ) {
		this.window.restore();
	}

	this.window.show();
};

MacPlatform.prototype.showNotificationsBadge = function ( count, bounceEnabled ) {
	app.dock.setBadge( ' ' );

	if ( bounceEnabled ) {
		app.dock.bounce();
	}
};

MacPlatform.prototype.clearNotificationsBadge = function () {
	app.dock.setBadge( '' );
};

MacPlatform.prototype.setDockMenu = function ( enabled ) {
	menuSetter.setRequiresUser( this.dockMenu, enabled );
};

module.exports = MacPlatform;
