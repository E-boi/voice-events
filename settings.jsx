const { React, getModule } = require('powercord/webpack');
const { Flex, FormTitle, Text, Button } = require('powercord/components');
const { SliderInput, TextInput, SelectInput } = require('powercord/components/settings');
const settings = [
	{ title: 'Join Message (Self)', setting: 'selfJoin' },
	{ title: 'Leave Message (self)', setting: 'selfLeave' },
	{ title: 'Move message (self)', setting: 'selfMove' },
	{ title: 'Join Message (Others)', setting: 'join' },
	{ title: 'Leave Message (Others)', setting: 'leave' },
	{ title: 'Private Call channel name', setting: 'privateCall' },
];
const { marginBottom20 } = getModule(['marginLarge'], false);

module.exports = class VoiceEventSettings extends React.PureComponent {
	constructor(props) {
		super(props);
		this.defaults = {
			voice: null,
			volume: 100,
			join: '$user joined $channel',
			leave: '$user left $channel',
			selfJoin: 'You joined $channel',
			selfMove: 'You were moved to $channel',
			selfLeave: 'You left $channel',
			privateCall: 'The call',
		};
	}

	render() {
		const { getSetting, updateSetting } = this.props;
		return (
			<>
				<SelectInput
					searchable={false}
					value={getSetting('voice')}
					onChange={val => updateSetting('voice', val.value)}
					options={speechSynthesis.getVoices().map(({ name, lang }) => ({
						label: React.createElement(
							Flex,
							null,
							React.createElement(Text, { style: { marginRight: 4 } }, name),
							React.createElement(Text, { color: Text.Colors.MUTED }, '[', lang, ']')
						),
						value: name,
					}))}
				>
					TTS Voice
				</SelectInput>
				<SliderInput
					minValue={1}
					maxValue={100}
					initialValue={getSetting('volume', 100)}
					markers={[1, 25, 50, 75, 100]}
					onValueChange={change => updateSetting('volume', change)}
				>
					TTS Volume
				</SliderInput>
				<FormTitle tag="h3">Messages</FormTitle>
				<Text className={marginBottom20} type="description">
					$user will get replaced with the respective User Nickname, $username with the User Account name and $channel with the respective Voice Channel name.
				</Text>
				{settings.map(({ title, setting }) => (
					<div className={marginBottom20}>
						<FormTitle>{title}</FormTitle>
						<Flex>
							<div style={{ flexGrow: 1, marginRight: 20 }}>
								<TextInput
									type="text"
									placeholder={this.defaults[setting]}
									defaultValue={getSetting(setting, this.defaults[setting])}
									onChange={val => updateSetting(setting, val)}
								/>
							</div>
							<Button
								className={Button.Sizes.SMALL}
								onClick={() =>
									this.speak(getSetting(setting).split('$user').join('user').split('$username').join('username').split('$channel').join('channel'), getSetting('voice'))
								}
							>
								Test
							</Button>
						</Flex>
					</div>
				))}
			</>
		);
	}
	speak(message, voice) {
		const voices = speechSynthesis.getVoices();
		const utterance = new SpeechSynthesisUtterance(message);
		utterance.voice = voices.find(e => e.name === voice);
		utterance.volume = this.props.settings.volume / 100;
		speechSynthesis.speak(utterance);
	}
};
